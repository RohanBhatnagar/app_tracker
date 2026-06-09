import React, { useState, useEffect } from "react";
import "../style.css";

import Recents from "./Recents";

import axiosInstance from "../api/axiosInstance";

const Home = ({ token, email, spreadsheetUrl }) => {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        if (email) {
          const response = await axiosInstance(
            `/protected/user/${email}/recents`
          );
          const data = response.data;
          let dicts = [];
          for (let i = 0; i < data.length; i++) {
            // console.log(data[i]);
            dicts.push({
              company: data[i][0],
              role: data[i][1],
              status: data[i][2],
            });
          }
          // console.log(dicts);
          setCards(dicts);
        }
      } catch (error) {
        console.error(error);
      }
    };
    if (email && token) {
      fetchCards();
    }
  }, [email, token]);

  return (
    <div class="home-wrapper">
      <div class="grid-layout">
        <Recents cards={cards}></Recents>
      </div>
    </div>
  );
};

export default Home;
