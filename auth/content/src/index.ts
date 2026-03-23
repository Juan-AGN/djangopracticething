import express, { NextFunction, Request, Response } from "express";
import http from "http";
import url from "url";
import { AccessToken, Errors  } from "./types";
import { generateHash, generateToken } from "./aux";


var cors = require('cors');

const getenv = require('getenv');

import { Family, PrismaClient, User } from "./generated/prisma/client";
import { match } from "assert";

const salt = getenv('SALT')

const prisma = new PrismaClient();

const app = express();
const port = 9999;

var tokenmap : Map<string, AccessToken[]>;

var tokens : AccessToken[];

const server = http.createServer(app);

export async function getuser(who: string) {
	let user = await prisma.user.findFirst({where: { name: who }});

	return (user);
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

export async function createrefreshtoken(family: Family) {
	const token = await getuniquerefreshtoken();
	let cdate = new Date();
	cdate.setDate(cdate.getDate() + 7);
	const date = (family.expiresAt > cdate) ? family.expiresAt : cdate;
	let refreshtoken = await prisma.refresh.create({data: { token: token, expiresAt: date, familyId: family.id, current: true}});

	return (refreshtoken);
}

export async function createfamily(user: User) {
	let date = new Date();
	date.setDate(date.getDate() + 30);
	let family = await prisma.family.create({data: { expiresAt: date, userId: user.id}});

	return (family);
}

app.use(express.json());

app.use(cors());

app.get("/", (req: Request, res: Response) => {
	return (res.send({ message: "Scores Service Running" }));
});

app.post("/register", async (req: Request, res: Response) => {
	const { user, password } = req.body;

	if (password == "" || password == undefined || user == undefined || user == "")
		return (res.status(400).json({ message: "Empty password and/or user not allowed." }));
	try {
		const existingUser = await getuser(user);

		if (!existingUser)
			await prisma.user.create({data: { name: user, password: generateHash(password + salt) },});
	} catch (err) {
		console.error("Error creating user:", err);
		return (res.status(400).json({ message: "Unknown error." }));
	}
	return (res.send("User succesfully created."));
});

app.post("/log", async (req: Request, res: Response) => {
	const { user, password } = req.body;

	if (password == "" || password == undefined || user == undefined || user == "")
		return (res.status(400).json({ message: "Empty password and/or user not allowed." }));
	try {
		const existingUser = await getuser(user);

		if (!existingUser)
			return (res.status(400).json({ message: "Not valid user." }));
		if (password != existingUser.password)
			return (res.status(400).json({ message: "Not valid password." }));

		const family = await createfamily(existingUser);
		const refreshtoken = await createrefreshtoken(family);

		res.cookie("refreshToken", refreshtoken.token, {
			httpOnly: true,
			secure: false,
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: "/",
		});

		return (res.json({message: "User succesfully logged.", user: user}));
	} catch (err) {
		console.error("Error logging user:", err);
		return (res.status(400).json({ message: "Unknown error." }));
	}
});

app.post("/create/match", async (req: Request, res: Response) => {
	const body = req.body as SubmitGameRequest;
	let data;

	if (body == undefined || body.password != connectPassword || body.results == undefined || body.results.first == undefined || body.results.first == "" || body.results.second == undefined || body.results.second == "")
		return ;

	try {
		const first = await getuser(body.results.first);
		const second = await getuser(body.results.second);
		const third = body.results.third ? await getuser(body.results.third) : null;
		const fourth = body.results.fourth ? await getuser(body.results.fourth) : null;

		const players = 2 + (third ? 1 : 0) + (fourth ? 1 : 0);

		if (!first || !second) {
			console.error("First or second user not found, match not created");
			return (res.end());
		}

		await prisma.user.update({where: {id: first.id}, data: { score: {increment: (6 * (players - 1))}}})
		await prisma.user.update({where: {id: second.id}, data: { score: {increment: (4 * (players - 1))}}})
		if (third)
			await prisma.user.update({where: {id: third.id}, data: { score: {increment: (2 * (players - 1))}}})
		if (fourth)
			await prisma.user.update({where: {id: fourth.id}, data: { score: {increment: (1 * (players - 1))}}})

		data = { firstId: first!.id, secondId: second!.id, thirdId: third?.id, fourthId: fourth?.id, players: players};
		await prisma.match.create({data: data});
	} catch (err) {
		console.error("Error creating match:", err);
	}
	return (res.end());
});

app.get("/matches/:user", async (req: Request, res: Response) => {
	let who: string = req.params.user;

	try {
		let tmatch = await getmatches(who);

		if (tmatch == undefined)
			return (res.send({ status: 'error', error: 'No user' }));
		return (res.send({status: 'ok', matches: tmatch}));
	} catch (err) {
		return (res.send({ status: 'error', error: err }));
	}
});

app.get("/users/:user", async (req: Request, res: Response) => {
	let who: string = req.params.user;

	try {
		let tuser = await getuser(who);

		if (tuser == undefined)
			return (res.send({ status: 'error', error: 'No user' }));
		return (res.send({status: 'ok', user: { name: tuser.name, score: tuser.score }}));
	} catch (err) {
		return (res.send({ status: 'error', error: err }));
	}
});

/*
app.post("/game/start", (req: Request, res: Response) => {
	const { lobbyId } = req.body;
	const session = gameManager.startGame(lobbyId);
	res.send(session);
});

app.get("/game/state/:sessionId", (req: Request, res: Response) => {
	const sessionId = req.params.sessionId;
	res.send(gameManager.getState(sessionId));
});
*/

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	res.status(500).send({ error: err.message });
});

server.listen(port, () => {
	console.log(`Authentification service running on port ${port}`);
});
