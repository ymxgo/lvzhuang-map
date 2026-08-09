import Experience, { allCases } from "./experience";
import { BookingCenter, BookingPortal } from "./booking";
import { DecisionHub } from "./decision";

export default function Page(){
  return <><Experience/><DecisionHub cases={allCases}/><BookingPortal cases={allCases}/><BookingCenter cases={allCases}/></>;
}
