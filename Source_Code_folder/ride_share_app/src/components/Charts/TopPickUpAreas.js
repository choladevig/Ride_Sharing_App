import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import API from './Api';

export default function TopPickupAreas() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/top_pickup_areas")
      .then(res => {
        const chart = res.data.labels.map((label, i) => ({
          area: label,
          count: res.data.counts[i],
        }));
        setData(chart);
      })
      .catch(console.error);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={data}>
        <XAxis type="number" />
        <YAxis dataKey="area" type="category" />
        <Tooltip />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
