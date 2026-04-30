import React, { useCallback, useEffect, useState, useRef } from 'react';

export const useInit = (fn: any) => {
  const firstRunRef = useRef(true);

  useEffect(() => {
    if(firstRunRef.current) {
      firstRunRef.current = false

      fn?.()
    }
  }), []};