import { useEffect, useState, useReducer, useMemo } from 'react';
import './App.css';

// TODO: update README
// TODO: add description (diagonals count), controls
// TODO: upgrade UI for settings and gameSettings, how to play
// TODO: page settings, dark mode and font size

function Game() {
  const [currentGame, setCurrentGame] = useState( {
    width: 20,
    height: 20,
    danger: 0.15,
    id: 0
  });
  const [newGame, setNewGame] = useState({
    width: 20,
    height: 20,
    danger: 0.15
  });

  function onChangeHandler(e) {
    setNewGame({
      ...newGame,
      [e.target.id]: parseInt(e.target.value)
    })
  }

  function onClickHandler(e) {
    e.preventDefault();
    setCurrentGame( {
      ...newGame,
      id: (currentGame.id + 1) % 10
    })
  }

  return (
    <>
      <form>
        <label htmlFor='width'>Width: </label>
        <input id='width' type='number' min={5} max={100} value={newGame.width} onChange={onChangeHandler} />
        <label htmlFor='height'>Height: </label>
        <input id='height' type='number' min={5} max={100} value={newGame.height} onChange={onChangeHandler} />
        <label htmlFor='danger'>Danger Ratio: </label>
        <input id='danger' type='number' min={0.05} max={0.97} value={newGame.danger} onChange={onChangeHandler} />
        <button id='restart' type='submit' onClick={onClickHandler}>New Game</button>
      </form>
      <Board key={currentGame.id} width={currentGame.width} height={currentGame.height} danger={currentGame.danger} />
    </>
  )
}

function Board({ width, height, danger }) {
  const [game, dispatch] = useReducer(gameReducer, {
    state: "reset",
    board: Array.from(Array(height), () => Array(width).fill(0)),
    squares: Array.from(Array(height), () => Array(width).fill(0)),
    danger: danger
  });

  const hints = useMemo(() => {
    let nextHints = Array.from(Array(game.board.length), () => Array(game.board[0].length).fill(0));
    for (let i = 0; i < game.board.length; i++) {
      for (let j = 0; j < game.board[0].length; j++) {
        let count = 0;
        if (game.board[i][j]) {
          nextHints[i][j] = -1;
          continue;
        }
        for (let x = Math.max(0, j - 1); x < Math.min(game.board[0].length, j + 2); x++) {
          for (let y = Math.max(0, i - 1); y < Math.min(game.board.length, i + 2); y++) {
            count += game.board[y][x];
          }
        }
        nextHints[i][j] = count;
      }
    }
    return nextHints;
  }, [game.board]);

  useEffect(() => dispatch({type: "reset"}), []);

  let gameStatusLabel;
  let resetButton = <button onClick={() => dispatch({type: "reset"})}>Reset</button>;
  switch (game.state) {
    case "win": gameStatusLabel = <p>Victory! {resetButton}</p>;
      break;
    case "lose": gameStatusLabel = <p>Game Over! {resetButton}</p>;
      break;
    default: gameStatusLabel = <p>Play!</p>;
  }

  return (
  <>
    <table cellPadding={0} cellSpacing={0}>
      <tbody>
        {game.board.map(function(row,y){
          return (
            <tr key={y}>
              {row.map(function(_, x){
                return (
                <td key={`${y}_${x}`}>
                  <Square hint={hints[y][x]} state={game.squares[y][x]} activate={() => { dispatch({
                    type: "activate",
                    pos: {x: x, y: y}
                  })}}
                  flag={() => { dispatch({
                    type: "flag",
                    pos: {x: x, y: y}
                  })}} />
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
            {gameStatusLabel}
          </td>
        </tr>
      </tfoot>
    </table>
  </>);
}

function Square({ hint, state, activate, flag }) {
  let content;
  if (state === 1) content = <>&#9872;</>;
  else if (state === 2) {
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
  }
  return (
  <button className={state === 2 ? 'clicked color' + hint : 'unclicked'} onContextMenu={(e) => {
    e.preventDefault();
    flag();
  }} onClick={activate}>
    {content}
  </button>
  );
}

function gameReducer(game, action) {
  console.debug(action.type, action.pos);
  switch(action.type) {
    case "activate":
      let tmpGame = structuredClone(game);
      if (game.state === "win" || game.state === "lose" || game.squares[action.pos.y][action.pos.x] !== 0) {
        return game;
      } else if (game.state === "reset") {
        tmpGame = {
          ...game,
          state: "playing",
          board: Array.from(game.board, (row) => Array.from(row, () => Math.random() < game.danger ? 1 : 0)),
          squares: Array.from(game.squares, ((a, i) => ([...a])))
        }
      }
      tmpGame.squares = tmpGame.squares.map((row, i) => action.pos.y !== i ? row : row.map((item, j) => action.pos.x !== j ? item : 2));

      if (tmpGame.board[action.pos.y][action.pos.x] === 1) {
        tmpGame.state = "lose";
      } else if (tmpGame.board.map((row, i) => (row.map((val, j) => (val ^ (tmpGame.squares[i][j] === 2)))).reduce((a, b) => (a && b))).reduce((a, b) => (a && b))) {
        tmpGame.state = "win";
      }
      let f = [[action.pos.y, action.pos.x]];
      let s = [];
      while (f.length > 0) {
        let c = f.pop();
        if (tmpGame.board.slice(Math.max(0, c[0] - 1), Math.min(tmpGame.board.length, c[0] + 2)).map(row => row.slice(Math.max(0, c[1] - 1), Math.min(tmpGame.board[0].length, c[1] + 2))).reduce((prev, row) => (prev + row.reduce((a, b) => a + b, 0)), 0) === 0) {
          for (let i = Math.max(0, c[0] - 1); i < Math.min(game.board.length, c[0] + 2); i++) {
            for (let j = Math.max(0, c[1] - 1); j < Math.min(game.board[0].length, c[1] + 2); j++) {
              console.log("checking: ", i, j);

              if (!s.some(item => (item[0] === i && item[1] === j)) && !f.some(item => (item[0] === i && item[1] === j)) && (i !== c[0] || j !== c[1])) {
                f.push([i,j]);
                console.log("added", i, j);
              }
            }
          }
        }
        s.push(c);
        for (const [i,j] of s) {
          tmpGame.squares[i][j] = 2;
        }
      }


      console.debug("setting game to:", tmpGame)
      return tmpGame;
    case "flag":
      if (game.state === "win" || game.state === "lose" || game.squares[action.pos.y][action.pos.x] === 2) {
        return game;
      }
      return {
        ...game,
        squares: game.squares.map((row, i) => action.pos.y !== i ? row : row.map((item, j) => action.pos.x !== j ? item : (item + 1) % 2))
      };
    case "reset":
      return {
        ...game,
        state: "reset",
        board: Array.from(Array(game.board.length), () => Array(game.board[0].length).fill(0)),
        squares: Array.from(Array(game.board.length), () => Array(game.board[0].length).fill(0))
      };
    default: 
      console.error("unknown dispatch type: ", action.type);
      return game;
  }
}

export default Game;
