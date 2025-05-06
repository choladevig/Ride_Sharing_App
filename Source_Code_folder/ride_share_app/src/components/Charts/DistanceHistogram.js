import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import API from './Api';

export default function DistanceHistogram() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/trip_distance")
      .then(res => {
        const chart = res.data.bins.map((bin, i) => ({
          bin: +bin.toFixed(1),
          count: res.data.counts[i],
        }));
        setData(chart);
      })
      .catch(console.error);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="bin" name="Miles" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
}
