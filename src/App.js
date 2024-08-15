import { useEffect, useState } from 'react';
import './App.css';

function Game() {
  let boardWidth = 20;
  let boardHeight = 20;
  const danger = 0.15;
  let [gameOver, setGameOver] = useState(false);
  let [gameInit, setGameInit] = useState(false);
  let [board, setBoard] = useState(Array.from(Array(boardHeight), _ => Array(boardWidth).fill(0)));
  let [hints, setHints] = useState(Array.from(Array(boardHeight), _ => Array(boardWidth).fill(0)));
  let [marked, setMarked] = useState(Array.from(Array(boardHeight), _ => Array(boardWidth).fill(false)))
  let [activated, setActivated] = useState(Array.from(Array(boardHeight), _ => Array(boardWidth).fill(false)))
  let gameStatus = <p>Play!</p>;
  let resetButton = <button onClick={reset}>Reset</button>;

  function reset() {
    console.log("reset");
    setGameInit(false);
    setGameOver(false);
    setMarked(Array.from(Array(boardHeight), _ => Array(boardWidth).fill(false)));
    setActivated(Array.from(Array(boardHeight), _ => Array(boardWidth).fill(false)));
  }

  function initBoard(x, y) {
    setGameInit(true);
    let nextBoard = Array.from(Array(boardHeight), _ => Array(boardWidth).fill(0));
    let nextHints = Array.from(Array(boardHeight), _ => Array(boardWidth).fill(0));
    for (let i = 0; i < boardWidth; i++) {
      for (let j = 0; j < boardHeight; j++) {
        nextBoard[i][j] = Math.random() < danger ? 1 : 0;
      }
    }
    nextBoard[x][y] = 0;
    for (let i = 0; i < boardHeight; i++) {
      for (let j = 0; j < boardWidth; j++) {
        let count = 0;
        if (nextBoard[i][j]) {
          nextHints[i][j] = -1;
          continue;
        }
        for (let x = Math.max(0, i - 1); x < Math.min(boardWidth, i + 2); x++) {
          for (let y = Math.max(0, j - 1); y < Math.min(boardHeight, j + 2); y++) {
            count += nextBoard[x][y];
          }
        }
        nextHints[i][j] = count;
      }
    }
    setBoard(nextBoard);
    setHints(nextHints);
    console.log(nextBoard);
  }

  function chainClick(found, searched = []) {
    let x = found[0][0];
    let y = found[0][1];
    for (let i = Math.max(0, x - 1); i < Math.min(boardWidth, x + 2); i++) {
      for (let j = Math.max(0, y - 1); j < Math.min(boardHeight, y + 2); j++) {
        if (!found.some((o) => (o[0] === i && o[1] === j)) 
          && !searched.some((o) => (o[0] === i && o[1] === j))) {
          if (hints[i][j] === 0) {
            found.push([i, j]);
          } else {
            searched.push([i, j]);
          }
        }
      }
    }
    searched.push(found.shift());
    if (found.length > 0) {
      chainClick(found, searched);
    } else {
      setActivated(activated.map((row, i) => (row.map((val, j) => searched.some((o) => (o[0] === i && o[1] === j))? true : val))))
    }
  }

  useEffect(reset, [boardHeight, boardWidth]);
  useEffect(() => {
    for (let i = 0; i < boardWidth; i++) {
      for (let j = 0; j < boardHeight; j++) {
        if (activated[i][j]) {
          if (hints[i][j] === 0) chainClick([[i,j]]);
          return
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hints])
  if (gameInit && board.map((row, i) => (row.map((val, j) => (val ^ activated[i][j]))).reduce((a, b) => (a && b))).reduce((a, b) => (a && b))) {

      gameStatus = <p>Victory! {resetButton}</p>
  } else if (gameOver) {
    gameStatus = <p>Game Over! {resetButton}</p>
  }
  return (
  <>
    <table>
      <tbody>
        {board.map(function(row,i){
          return (
            <tr key={i}>
              {row.map(function(_, j){
                return (
                <td key={`${i}_${j}_wrapper`}>
                  <Square hint={hints[i][j]} gameOver={gameOver} setGameOver={setGameOver} marked={marked[i][j]} setMarked={(x) => {
                     setMarked(marked.map((row, rowi) => (i !== rowi ? row : row.map((val, valj) => (j !== valj ? val : x)))))
                  }} activated={activated[i][j]} setActivated={(x) => {
                    setActivated(activated.map((row, rowi) => (i !== rowi ? row : row.map((val, valj) => (j !== valj ? val : x)))))
                 }} initBoard={() => initBoard(i,j)} gameInit={gameInit} 
                 chainClick={() => chainClick([[i,j]])} key={`${i}_${j}`} />
                </td>
                )
              })}
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan="100%">
            {gameStatus}
          </td>
        </tr>
      </tfoot>
    </table>
  </>);
}

function Square({ hint, gameOver, setGameOver, marked, setMarked, activated, setActivated, gameInit, initBoard, chainClick }) {
  let content;
  if (marked) content = <>&#9872;</>;
  
  function rightClick(e) {
    e.preventDefault();
    if (gameOver || activated) return;
    setMarked(!marked);
  }

  function click() {
    if (gameOver || marked) return;
    setActivated(true);
    if (!gameInit) {
      initBoard();
    } else { 
      if (hint === 0) chainClick();
      if (hint < 0) setGameOver(true);
    }
  }
  if (activated) {
    switch(hint) {
      case -1:
        content = ":(";
        break;
      case 0:
        content = "";
        break;
      default:
        content = hint;
    }
    return (
      <button className={'clicked color' + hint}>
        {content}
      </button>
    );
  }
  return (
  <button className='unclicked' onContextMenu={rightClick} onClick={click}>
    {content}
  </button>
  );
}

export default Game;
