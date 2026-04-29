import express, { NextFunction, Request, Response } from "express";
import http from "http";
import url from "url";
import { AccessToken, Errors  } from "./types";
import { generateHash, generateToken } from "./aux";
import cookieParser from "cookie-parser";

var cors = require('cors');

const getenv = require('getenv');

import { Family, PrismaClient, Refresh, User } from "./generated/prisma/client";
import { match } from "assert";

const salt = getenv('SALT')

const prisma = new PrismaClient();

const app = express();
const port = 9999;

app.use(cookieParser());

var tokenmap : Map<string, AccessToken[]> = new Map();

var tokens : AccessToken[] = [];

const server = http.createServer(app);

export async function getuser(who: string) {
	let user = await prisma.user.findFirst({where: { name: who }});

	return (user);
}

export async function cleanupactokens() {
	let atoken : AccessToken[] = tokens.filter(token => (token.enddate < new Date()));

	for (let element of atoken)
	{
		const userTokens = tokenmap.get(element.user);

		if (userTokens)
		{
			const idx = userTokens.findIndex(ttoken => ttoken.token === element.token && ttoken.user === element.user);
			if (idx !== -1)
				userTokens.splice(idx, 1);
		}

		const idxarr = tokens.findIndex(ttoken => ttoken.token === element.token && ttoken.user === element.user);
		if (idxarr !== -1)
			tokens.splice(idxarr, 1);
	}
}

export async function cleanupretokens() {
	await prisma.family.deleteMany({where: { expiresAt: { lte: new Date() }}});
}

export async function cleanupfamily( fid : number ) {
	await prisma.family.delete({ where: { id: fid } });
}

export async function getrefreshtoken(token: string) {
	let refreshtoken = await prisma.refresh.findUnique({where: {token: token}});

	return (refreshtoken);
}

export async function getfamily(token: Refresh) {
	let family = await prisma.family.findUnique({where: {id: token.familyId}});

	return (family);
}

export async function invalidaterefresh(token: Refresh) {
	let family = await prisma.refresh.update({data: {current: false}, where: {token: token.token}});

	return (family);
}

export async function consumerefreshtoken(token: string) {
	const result = await prisma.refresh.updateMany({
		where: {
		token: token,
		current: true,
		expiresAt: { gt: new Date() }
		},
		data: {
		current: false
		}
	});

	return (result.count);
}

export async function getuniquerefreshtoken() {
	let token = "";
	let success = false;
	let refreshtoken; 

	while (!success)
	{
		token = generateToken();
		refreshtoken = await prisma.refresh.findFirst({where: { token: token }});
		if (!refreshtoken)
			success = true;
	}

	return (token);
}

export async function getuniqueaccesstoken(user: string) {
	let token = "";
	let success = false;

	if (!tokenmap.has(user))
	{
		tokenmap.set(user, []);
		return (generateToken());
	}

	let usertokens = tokenmap.get(user);

	if (usertokens == undefined || usertokens?.length == 0)
		return (generateToken());

	while (!success)
	{
		token = generateToken();
	
		success = true;
		for (let element of usertokens)
			if (element.token == token)
				success = false;
	}

	return (token);
}

export async function createrefreshtoken(family: Family) {
	const token = await getuniquerefreshtoken();
	let cdate = new Date();
	cdate.setDate(cdate.getDate() + 7);
	const date = (family.expiresAt > cdate) ? family.expiresAt : cdate;
	let refreshtoken = await prisma.refresh.create({data: { token: token, expiresAt: date, familyId: family.id, current: true}});

	return (refreshtoken);
}

export async function createaccess(user: string) {
	const token = await getuniqueaccesstoken(user);
	let cdate = new Date();
	cdate.setMinutes(cdate.getMinutes() + 15);
	
	let accestoken : AccessToken = {
		user: user,
		token: token,
		enddate: cdate
	};

	tokenmap.get(user)!.push(accestoken);
	tokens.push(accestoken);

	return (token);
}

export async function createfamily(user: User) {
	let date = new Date();
	date.setDate(date.getDate() + 30);
	let family = await prisma.family.create({data: { expiresAt: date, userId: user.id}});

	return (family);
}

export async function autoclean(time: number) {
	await cleanupactokens();
	await cleanupretokens();
	console.log(`[ ${new Date()} ] Cleaned expired tokens.`);

	setTimeout(() => {
		autoclean(time);
	}, time);
}

app.use(express.json());

app.use(cors());

app.get("/api/auth/", (req: Request, res: Response) => {
	return (res.send({ message: "Auth Service Running" }));
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
	const { user, password } = req.body;

	if (password == "" || password == undefined || user == undefined || user == "")
		return (res.status(400).json({ message: "Empty password and/or user not allowed." }));
	try {
		const existingUser = await getuser(user);

		if (!existingUser)
			await prisma.user.create({data: { name: user, password: generateHash(password + salt)}});
	} catch (err) {
		console.error("Error creating user:", err);
		return (res.status(400).json({ message: "Unknown error." }));
	}
	return (res.send("User succesfully created."));
});

app.post("/api/auth/log", async (req: Request, res: Response) => {
	const { user, password } = req.body;

	if (password == "" || password == undefined || user == undefined || user == "")
		return (res.status(400).json({ message: "Empty password and/or user not allowed." }));
	try {
		const existingUser = await getuser(user);

		if (!existingUser)
			return (res.status(400).json({ message: "Not valid user." }));
		if (generateHash(password + salt) != existingUser.password)
			return (res.status(400).json({ message: "Not valid password." }));

		const family = await createfamily(existingUser);
		const refreshtoken = await createrefreshtoken(family);
		const accesstoken = await createaccess(user);

		res.cookie("refreshToken", refreshtoken.token, {
			httpOnly: true,
			secure: false,
			sameSite: "strict",
			maxAge: refreshtoken.expiresAt.getTime() - Date.now(),
			path: "/",
		});
	
		res.cookie("accessToken", accesstoken , {
			httpOnly: true,
			secure: false,
			sameSite: "strict",
			maxAge: 15 * 60 * 1000,
			path: "/",
		});

		return (res.json({message: "User succesfully logged.", user: user}));
	} catch (err) {
		console.error("Error logging user:", err);
		return (res.status(400).json({ message: "Unknown error." }));
	}
});

app.post("/api/auth/refresh", async (req: Request, res: Response) => {
	const { user } = req.body;
	const prevToken = req.cookies.refreshToken;

	if (user == undefined || user == "")
		return (res.status(400).json({ message: "Empty user not allowed." }));
	try {
		const existingUser = await getuser(user);

		if (!existingUser)
			return (res.status(400).json({ message: "Not valid user." }));

		if (!prevToken || typeof prevToken !== "string")
			return (res.status(400).json({ message: "Not valid token." }));

		const truetoken = await getrefreshtoken(prevToken);
	
		if (truetoken == undefined)
			return (res.status(400).json({ message: "Not valid token." }));

		if (truetoken.expiresAt.getTime() < Date.now())
			return (res.status(400).json({ message: "Expired token." }))

		const consumed = await consumerefreshtoken(truetoken.token);
		if (consumed === 0)
		{
			await cleanupfamily(truetoken.familyId);
			return (res.status(400).json({ message: "Not valid token, reused token." }));
		}

		const family = await getfamily(truetoken);
		if (family === undefined)
			return (res.status(400).json({ message: "Unexpected error." }));
		const refreshtoken = await createrefreshtoken(family!);
		const accesstoken = await createaccess(user);

		res.cookie("refreshToken", refreshtoken.token, {
			httpOnly: true,
			secure: false,
			sameSite: "strict",
			maxAge: refreshtoken.expiresAt.getTime() - Date.now(),
			path: "/",
		});
	
		res.cookie("accessToken", accesstoken , {
			httpOnly: true,
			secure: false,
			sameSite: "strict",
			maxAge: 15 * 60 * 1000,
			path: "/",
		});

		return (res.json({message: "Token succesfully refreshed.", user: user}));
	} catch (err) {
		console.error("Error logging user:", err);
		return (res.status(400).json({ message: "Unknown error." }));
	}
});

app.get("/api/auth/users/:user", async (req: Request, res: Response) => {
	let who = typeof req.params.user === "string" ? req.params.user :  req.params.user[0];

	try {
		let tuser = await getuser(who);

		if (tuser == undefined)
			return (res.send({ status: 'error', error: 'No user' }));
		return (res.send({status: 'ok', user: tuser}));
	} catch (err) {
		return (res.send({ status: 'error', error: err }));
	}
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	res.status(500).send({ error: err.message });
});

server.listen(port, () => {
	console.log(`Authentification service running on port ${port}`);
});

autoclean(60 * 60 * 1000);
