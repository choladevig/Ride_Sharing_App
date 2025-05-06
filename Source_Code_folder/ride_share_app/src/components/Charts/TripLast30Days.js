// src/components/TripsLast30Days.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import API from './Api';

export default function TripsLast30Days() {
  const [data, setData] = useState([]);
  useEffect(() => {
    API.get("/trips_last_30_days")
      .then(res => {
        const arr = res.data.x.map((x, i) => ({
          x,
          y: res.data.y[i]
        }));
        setData(arr);
      })
      .catch(console.error);
  }, []);
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" name="Date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="y" stroke="#82ca9d" dot={false}/>
      </LineChart>
    </ResponsiveContainer>
  );
}
