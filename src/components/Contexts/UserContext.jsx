import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import { BASE_URL } from '../../config';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [data, setData] = useState(null);

  const fetchUserData = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setData(null);
        return;
      }
      const result = await axios.get(`${BASE_URL}user`, { params: { userId } });
      setData(result.data.user);
    } catch (err) {
      console.log(err);
      setData(null);
    }
  }, []);

  const eraseUserData = useCallback(() => {
    setData(null);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <UserContext.Provider value={{ data, fetchUserData, eraseUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserData = () => useContext(UserContext);