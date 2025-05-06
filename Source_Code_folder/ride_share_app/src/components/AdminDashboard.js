// src/components/Dashboard.jsx
import React from "react";
// import DurationHistogram from "./Charts/DurationHistogram";
// import DistanceHistogram from "./Charts/DistanceHistogram";
import TripsByHour from "./Charts/TripsByHour";
import Headers from '../components/Header';
// import TopPickupAreas from "./Charts/TopPickUpAreas";
// import PaymentPie from "./Charts/PaymentPie";
import DistanceVsFare from "./Charts/DistanceVsFare";
import TripsByWeekday from "./Charts/TripByWeekDay";
import TripsLast30Days from "./Charts/TripLast30Days";
// import AvgFareByArea from "./Charts/AvgFareByArea";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  return (<>
  <div>
     <Headers />
     </div>
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {/* <div className="chart-card">
          <h2>Trip Duration (min) Histogram</h2>
          <DurationHistogram />
        </div> */}

        {/* <div className="chart-card">
          <h2>Trip Distance (mi) Histogram</h2>
          <DistanceHistogram />
        </div> */}

        <div className="chart-card">
          <h2>Trips by Hour of Day</h2>
          <TripsByHour />
        </div>

        <div className="chart-card">
          <h2>Trips by Weekday</h2>
          <TripsByWeekday />
        </div>

        <div className="chart-card">
          <h2>Trips (Last 30 Days)</h2>
          <TripsLast30Days />
        </div>

        {/* <div className="chart-card">
          <h2>Top 10 Pickup Areas</h2>
          <TopPickupAreas />
        </div> */}

        {/* <div className="chart-card">
          <h2>Payment Type Breakdown</h2>
          <PaymentPie />
        </div> */}

        <div className="chart-card">
          <h2>Distance vs. Fare Scatter</h2>
          <DistanceVsFare />
        </div>

        {/* <div className="chart-card">
          <h2>avg_fare_by_area</h2>
          <AvgFareByArea />
        </div> */}
      </div>
    </div>
  </>
  );
}