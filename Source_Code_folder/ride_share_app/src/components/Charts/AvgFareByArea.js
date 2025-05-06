import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import API from './Api';

export default function AvgFareByArea() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/avg_fare_by_area")
      .then(res => {
        const chart = res.data.areas.map((area, i) => ({
          area,
          avg: res.data.averages[i],
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
        <Bar dataKey="avg" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );
}
