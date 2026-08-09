import { createRoot } from "react-dom/client";
import { BookingCenter, BookingPortal } from "../app/booking";
import { DecisionHub } from "../app/decision";
import Experience, { allCases } from "../app/experience";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("Missing application root");

createRoot(root).render(
  <>
    <Experience />
    <DecisionHub cases={allCases} />
    <BookingPortal cases={allCases} />
    <BookingCenter cases={allCases} />
  </>,
);
