import RosterConflictManagement from "../components/roster/conflicts/RosterConflictManagement";

import { useParams } from "react-router-dom";

const RosterConflict = () => {
  const { rosterId } = useParams();
  return <RosterConflictManagement rosterId={rosterId} />;
};

export default RosterConflict;
