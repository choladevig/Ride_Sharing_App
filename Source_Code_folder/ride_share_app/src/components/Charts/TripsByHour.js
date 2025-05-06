import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import API from './Api';

export default function TripsByHour() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/trips_by_hour")
      .then(res => {
        const chart = res.data.x.map((hour, i) => ({
          hour,
          count: res.data.y[i],
        }));
        setData(chart);
      })
      .catch(console.error);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="hour" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#ff7300" />
      </LineChart>
    </ResponsiveContainer>
  );
}
