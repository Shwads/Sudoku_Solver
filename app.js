import { Sudoku, SudokuSet, checkLegalState, printState, checkSolved } from "./index.js";
import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import e from "express";

let server = express();
const PORT = 3000;

server.use(express.static("public"));
server.set('view engine', 'ejs');
server.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/puzzleDB");

const puzzleSchema = new mongoose.Schema({
    puzzle: [Number],
    difficulty: String,
    completed: Boolean,
});

const Puzzle = mongoose.model("Puzzle", puzzleSchema);

let puzzle = [[0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0, 0]];

let currentPuzzleID = null;

//================================================================================================================================================
// As Mongo does not support storing 2D arrays, we create 2 functions to allow us to flatten our sudoku puzzles into 1D arrays for storage and
// then to fold them back into 2D form after retrieval.
//================================================================================================================================================

function flatten(arr) {
    let output = [];
    for (let x = 0; x < arr.length; x++) {
        for (let y = 0; y < arr[x].length; y++) {
            output.push(arr[x][y]);
        }
    }
    return output;
}

function fold(arr) {
    let puzzle = [[]];
    let row = 0;
    for (let x = 0; x < arr.length; x++) {
        if (x%9 === 0 && x!=0) {
            puzzle.push([]);
            row += 1;
        }
        puzzle[row].push(arr[x]);
    }
    return puzzle;
}

//================================================================================================================================================
//================================================================================================================================================

server.get("/", (req, res) => {
    res.render("home");
});

server.get("/submit", (req, res) => {
    res.render("submit");
});

server.post("/submitPuzzle", async function(req, res) {
    let submitted = [[0, 0, 0, 0, 0, 0, 0, 0, 0],
                     [0, 0, 0, 0, 0, 0, 0, 0, 0],
                     [0, 0, 0, 0, 0, 0, 0, 0, 0],
                     [0, 0, 0, 0, 0, 0, 0, 0, 0],
                     [0, 0, 0, 0, 0, 0, 0, 0, 0],
                     [0, 0, 0, 0, 0, 0, 0, 0, 0],
                     [0, 0, 0, 0, 0, 0, 0, 0, 0],
                     [0, 0, 0, 0, 0, 0, 0, 0, 0],
                     [0, 0, 0, 0, 0, 0, 0, 0, 0]];

    let difficulty = req.body.difficulty;
    
    for (let x = 0; x < submitted.length; x++) {
        for (let y = 0; y < submitted[x].length; y++) {
            let currentCell = `${x}.${y}`;
            let currNum = req.body[currentCell];

            if (currNum.length > 0) {
                let asInt = parseInt(currNum);

                if (!(asInt === NaN)) {
                    submitted[x][y] = asInt;
                }
            }
        }
    }

    if (checkLegalState(submitted)) {
        let asSudoku = new Sudoku(submitted);

        let solvable = asSudoku.solve();

        if (solvable) {
            //printState(submitted);
            let flattened = flatten(submitted);
            //console.log(flattened);
            const newPuzzle = new Puzzle({
                puzzle: flattened,
                difficulty: difficulty,
            });

             await newPuzzle.save().catch((Err) => {
                 console.log(`Encountered error while saving the model: ${Err}`);
            });
            res.redirect("/submitted");

        } else {
            console.log("no solutions found");
        }
    } else {
        console.log("non legal state");
    }
});

server.get("/submitted", (req, res) => {
    res.render("submitted");
});

server.get("/select", (req, res) => {
    res.render("selectPuzzle");
})

server.post("/select/:difficulty", async function(req, res) {
    let puzzles;
    switch (req.params.difficulty) {
        case "Random": {
            let puzzles = await Puzzle.find({difficulty: req.params.difficulty, completed: false});
            if (puzzles.length === 0) {
                console.log("You've completed all of the puzzles!");
            }
            break;
        }
        default: {
            let puzzles = await Puzzle.find({difficulty: req.params.difficulty, completed: false});

            
            if (puzzles.length === 0) {
                console.log("You've completed all the puzzles in this difficulty category!");
            }
            break;
        }
    }
    let indexOfPuzzle = Math.floor(Math.random() * puzzles.length);
    let selectedPuzzle = puzzles[indexOfPuzzle];

    currentPuzzleID = selectedPuzzle.id;
    selectedPuzzle = fold(selectedPuzzle.puzzle);
    puzzle = selectedPuzzle;

    res.redirect("/puzzle");
});

server.get("/puzzle", (req, res) => {
    let immutables = [];

    for (let x = 0; x < puzzle.length; x++) {
        for (let y = 0; y < puzzle[x].length; y++) {
            if (puzzle[x][y] != 0) {
                let asString = x.toString() +"."+y.toString();
                immutables.push(asString);
            }
        }
    }

    res.render("puzzle", { puzzle: puzzle });
});

server.post("/puzzle/submit", async function(req, res) {

    for (let cell in req.body) {
        if (req.body[cell] != 0) {
            console.log(`${cell}: ${req.body[cell]}`);
            let coords = cell.split(".");
            let rowIndex = parseInt(coords[0]);
            let colIndex = parseInt(coords[1]);

            puzzle[rowIndex][colIndex] = req.body[cell];
        }
    }

    if (checkSolved(puzzle)) {
        console.log("Well done!");
        await Puzzle.updateOne({id: currentPuzzleID}, {completed: true});
    } else {
        console.log("better luck next time");
    }
});

server.listen(PORT, () => {
    console.log("Server listening on port: ", PORT);
});


// let firstSudoku = new Sudoku(puzzle);
// let solved = firstSudoku.solve();
// firstSudoku.printState();
// console.log(firstSudoku.hasLegalState());