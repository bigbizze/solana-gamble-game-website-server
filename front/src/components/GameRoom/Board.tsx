import * as React from "react";
import { TDispatch } from "../../use-solana-game/utils/shared_types";
import { Grid, TokenBal } from "../../containers/Homepage";

const rows = new Array(6).fill("0");
const cols = new Array(7).fill(rows);

const Cell = ({
                value,
                indexRow,
                indexCol,
                myAddress,
              }: {
  value: string
  indexRow: number
  indexCol: number
  myAddress: string
}) => {
  const color =
    value === "0"
      ? "bg-gray-100"
      : value === myAddress
        ? "bg-yellow-200"
        : "bg-red-200";

  return (
    <div className="w-20 h-20 m-3">
      <div
        className={ `shadow-inner rounded-full w-full h-full ${ color } flex justify-center items-center` }
      >
        {/* {indexRow} - {indexCol} */ }
      </div>
    </div>
  );
};

const Board = ({
                 onLeaveGame,
                 emitPlay,
                 myAddress,
                 grid,
                 setGrid,
                 userGameTokenBal
               }: {
  onLeaveGame: () => void,
  emitPlay: (updatedGrid: Grid) => void
  myAddress: string
  grid: Grid
  setGrid: TDispatch<Grid>,
  userGameTokenBal: TokenBal
}) => {
  const play = (indexCol: number) => {
    const updatedGrid = grid.map((col, i) => {
      if (i !== indexCol) return col;

      const updateCol = () => {
        let cellIsUpdated = false;
        return col
          .reverse()
          .map(cell => {
            if (cell !== "0" || cellIsUpdated) return cell;
            cellIsUpdated = true;
            return myAddress;
          })
          .reverse();
      };

      return updateCol();
    });
    emitPlay(updatedGrid);
    setGrid(updatedGrid);
  };

  return (
    <div
      className="w-screen h-screen flex justify-center items-center"
      style={ {
        background:
          "linear-gradient(150deg, rgba(209,255,211,1) 0%, rgba(153,255,250,1) 6%, rgba(212,161,255,1) 100%)",
      } }
    >
      <div style={ {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: 215,
        alignItems: "center",
        rowGap: 16
      } }>
        <div style={ { width: 190, height: 25 } }>Your Game Tokens: { userGameTokenBal.userTokenBal }</div>
        <div style={ { width: 150, height: 25 } }>Match Tokens: { userGameTokenBal.userGameTokenBal }</div>
        <div style={ { padding: 8, margin: 8, width: 150, height: 75, backgroundColor: "white" } }>
          <button onClick={ onLeaveGame }
                  style={ { backgroundColor: "rgb(210, 210, 210)", width: "100%", height: "100%" } }>
            Leave Game
          </button>
        </div>
      </div>
      <div className="bg-white max-w-7xl shadow-xl rounded-lg flex">
        { grid.map((cols, indexCol) => {
          return (
            <div
              key={ `col-${ indexCol }` }
              className="hover:bg-gray-100 rounded-lg cursor-pointer"
              onClick={ () => play(indexCol) }
            >
              { cols.map((row: string, indexRow: number) => {
                return (
                  <Cell
                    key={ `cell-${ indexCol }-${ indexRow }` }
                    value={ row }
                    indexRow={ indexRow }
                    indexCol={ indexCol }
                    myAddress={ myAddress }
                  />
                );
              }) }
            </div>
          );
        }) }
      </div>
    </div>
  );
};

export default Board;
