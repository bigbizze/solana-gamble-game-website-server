import { Option } from "../../front/src/use-solana-game/utils/shared_types";

function chkLine(a: string, b: string, c: string, d: string) {
  return ((a !== "0") && (a === b) && (a === c) && (a === d));
}

export function checkConnectFourWinner(bd: string[][]): Option<string> {
  const numRows = bd[0].length;
  const numCols = bd.length;
  const halfRows = Math.floor(numRows / 2);
  const halfColsPlusOne = Math.floor(numCols / 2) + 1;
  for (let cols = 0; cols < numCols; cols++) {
    for (let rows = 0; rows < halfRows; rows++) {
      if (chkLine(bd[cols][rows], bd[cols][rows + 1], bd[cols][rows + 2], bd[cols][rows + 3])) {
        return bd[cols][rows];
      }
    }
  }

  // Check right
  for (let cols = 0; cols < halfColsPlusOne; cols++) {
    for (let rows = 0; rows < numRows; rows++) {
      if (chkLine(bd[cols][rows], bd[cols + 1][rows], bd[cols + 2][rows], bd[cols + 3][rows])) {
        return bd[cols][rows];
      }
    }
  }

  // Check down-right
  for (let cols = 0; cols < halfColsPlusOne; cols++) {
    for (let rows = 0; rows < halfRows; rows++) {
      if (chkLine(bd[cols][rows], bd[cols + 1][rows + 1], bd[cols + 2][rows + 2], bd[cols + 3][rows + 3])) {
        return bd[cols][rows];
      }
    }
  }

  // Check down-left
  for (let cols = 0; cols < halfColsPlusOne; cols++) {
    for (let rows = 3; rows < numRows; rows++) {
      if (chkLine(bd[cols][rows], bd[cols + 1][rows - 1], bd[cols + 2][rows - 2], bd[cols + 3][rows - 3])) {
        return bd[cols][rows];
      }
    }
  }
}
