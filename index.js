

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export class SudokuSet {
    constructor(list) {
        let array = [...list];

        array.sort();

        this._items = [];

        let lastItem = null;
        array = array.filter((item) => item>0);

        let found = array.find((item) => item > 9);
        if (found === undefined) {
            for (let x = 0; x < array.length; x++) {
                let currItem = array[x];

                if (lastItem === null) {
                    this._items.push(currItem);
                    lastItem = currItem;
                } else {
                    if (currItem === lastItem) {
                        throw new Error("Unable to initialise SudokuSet: SudokuSet object cannot contain duplicates.");
                    } else {
                        this._items.push(currItem);
                        lastItem = currItem;
                    }
                }
            
            }
        }
    }

    get items() {
        return this._items;
    }

    addItem(item) {
        let inArray = this.items.indexOf(item);

        if (item < 10 && item > 0) {
            if (inArray < 0) {
                this.items.push(item);
            } else {
                throw new Error("Unable to add "+item+" to set: the Set class cannot contain duplicate items.");
            }
        } else {
            let errorString = `A SudokuSet cannot contain numbers greater than 9 or smaller than 1. Item value: ${item}`
            throw new Error(errorString);
        }
    
    }

    removeItem(item) {
        let inArray = this.items.indexOf(item);

        if (inArray >= 0) {
            this.items.splice(inArray, 1);
        }
    }

    isCompleteSet() {
        this._items.sort();
        if (this._items.length===9 && this._items[0]===1 && this._items[8]===9) {
            return true;
        } else {
            return false;
        }
    }

    has(num) {
        let index = this._items.indexOf(num);

        if (index < 0) {
            return false;
        } else {
            return true;
        }
    }

    missingNums() {
        let missing = [];
        for (let x = 1; x < 10; x++) {
            if (!this.has(x)) {
                missing.push(x);
            }
        }
        return missing;
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

export class Sudoku {
    #rows = new Map();
    #cols = new Map();
    #squares = new Map();
    #initialState;
    #solvable = true;
    
    constructor(puzzle) {
        this._puzzle = [];
        this.#initialState = [];

        for (let x = 0; x < 9; x++) {
            this._puzzle.push(puzzle[x].slice());
            this.#initialState.push(puzzle[x].slice());
        }

        for (let x = 0; x < puzzle.length; x++) {
            let col = puzzle.map((row) => row[x]);
            let colSet = new SudokuSet(col);
            this.#cols.set(x, colSet);

            let rowSet = new SudokuSet(puzzle[x]);
            this.#rows.set(x, rowSet);
        }

        for (let x = 0; x < puzzle.length; x++) {
            for (let y = 0; y < puzzle[x].length; y++) {
                let rowBox = Math.floor(x/3);
                let colBox = Math.floor(y/3);

                let currBox = rowBox.toString() +"."+colBox.toString();
                let currVal = puzzle[x][y];

                if (!this.#squares.has(currBox)) {
                    let thisSet = new SudokuSet([]);
                    this.#squares.set(currBox, thisSet);
                }

                if (currVal > 0) {
                    let thisSet = this.#squares.get(currBox);
                    thisSet.addItem(currVal);
                    this.#squares.set(currBox, thisSet);
                }
            }
        }
    }

    get puzzle() {
        return this._puzzle;
    }

    restore() {
        this._puzzle = new Array(...this.#initialState);
        this.#cols.clear();
        this.#rows.clear();

        for (let x = 0; x < puzzle.length; x++) {
            let col = puzzle.map((row) => row[x]);
            let colSet = new SudokuSet(col);
            this.#cols.set(x, colSet);

            let rowSet = new SudokuSet(puzzle[x]);
            this.#rows.set(x, rowSet);
        }
    }

    hasLegalState() {
        for (let x = 0; x < this._puzzle.length; x ++) {
            try {
                let columnSet = new SudokuSet(this._puzzle.map((row) => row[x]));
                let rowSet = new SudokuSet(this._puzzle[x]);
            } catch {
                return false;
            }
        }
        return true;
    }

    put(row, column, num) {
        this._puzzle[row][column] = num;
    }

    printState() {
        for (let x = 0; x < this._puzzle.length; x++) {
            let lineString = "||";
            for (let y = 0; y < this._puzzle[x].length; y++) {
                switch (this._puzzle[x][y]) {
                    case 0: 
                        lineString += "   ";
                        break;
                    default:
                        lineString += " " + this._puzzle[x][y] + " ";
                        break;
                }
                if ((y+1)%3 === 0) {
                    lineString += "||"
                } else {
                    lineString += "|";
                }
            }
            console.log(lineString);
            if ((x+1)%3 === 0) {
                console.log("=========================================");
            } else {
                console.log("-----------------------------------------");
            }
        }
    }

    #getBoxName(rowIndex, colIndex) {
        let rowName = Math.floor(rowIndex/3);
        let colName = Math.floor(colIndex/3);

        return rowName.toString() +"."+ colName.toString();

    }

    #possibleValues(rowIndex, colIndex) {
        let currRow = this.#rows.get(rowIndex);
        let currCol = this.#cols.get(colIndex);

        let boxName = this.#getBoxName(rowIndex, colIndex);
        //console.log(this.#squares)
        let currBox = this.#squares.get(boxName);

        let vals = [];

        for (let x = 1; x < 10; x++) {
            if (!(currRow.has(x)) && !(currCol.has(x)) && !(currBox.has(x))) {
                vals.push(x);
            }
        }
        return vals;
    }

    #updatePuzzle(rowIndex, colIndex, num) {
        this._puzzle[rowIndex][colIndex] = num;
        let row = this.#rows.get(rowIndex);
        let col = this.#cols.get(colIndex);

        row.addItem(num);
        col.addItem(num);

        this.#rows.set(rowIndex, row);
        this.#cols.set(colIndex, col);

        let boxName = this.#getBoxName(rowIndex, colIndex);

        let box = this.#squares.get(boxName);

        box.addItem(num);

        this.#squares.set(boxName, box);
    }

    #revert(rowIndex, colIndex) {
        let currVal = this._puzzle[rowIndex][colIndex];

        if (currVal > 0) {
            let row = this.#rows.get(rowIndex);
            let col = this.#cols.get(colIndex);

            row.removeItem(currVal);
            col.removeItem(currVal);

            this.#rows.set(rowIndex, row);
            this.#cols.set(colIndex, col);

            let boxName = this.#getBoxName(rowIndex, colIndex);

            let box = this.#squares.get(boxName);

            box.removeItem(currVal);

            this.#squares.set(boxName, box);

            this._puzzle[rowIndex][colIndex] = 0;
        }
    }

    #recursiveSolve() {
            
        for (let x = 0; x < this._puzzle.length; x++) {
            for (let y = 0; y < this._puzzle[0].length; y++) {
                if (this._puzzle[x][y] === 0) {
                     
                    let values = this.#possibleValues(x, y);

                    if (values.length)

                    for (let n = 0; n < values.length; n ++) {
                        this.#updatePuzzle(x, y, values[n]);

                        if (this.#recursiveSolve()) {
                            return true;
                        }
                        
                        this.#revert(x, y);
                    }

                    return false;
                } 
            }
        }

        return true;          
    }

    solve() {
        //this.restore();
        let solved = this.#recursiveSolve();
        //this.printState();
        return solved;
    }
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

let puzzle = [[1, 3, 0, 0, 0, 0, 9, 0, 4],
              [9, 4, 0, 8, 3, 0, 2, 0, 0],
              [0, 0, 8, 5, 0, 0, 0, 0, 3],
              [0, 0, 9, 0, 0, 5, 3, 7, 0],
              [4, 0, 0, 9, 0, 0, 0, 6, 1],
              [0, 8, 0, 0, 6, 0, 0, 2, 0],
              [0, 0, 4, 1, 0, 7, 0, 0, 2],
              [8, 0, 2, 3, 0, 6, 7, 4, 5],
              [3, 5, 7, 2, 0, 0, 0, 0, 0]];

let puzzle2 = [[0, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 0]];

let puzzle3 = [[7, 0, 3, 0, 2, 8, 0, 0, 1],
               [6, 0, 0, 0, 0, 0, 0, 0, 0],
               [0, 9, 0, 0, 5, 4, 3, 0, 6],
               [2, 0, 0, 1, 4, 9, 0, 5, 3],
               [5, 0, 0, 0, 0, 0, 0, 0, 9],
               [4, 8, 0, 5, 3, 6, 0, 0, 2],
               [9, 0, 6, 4, 7, 0, 0, 3, 0],
               [0, 0, 0, 0, 0, 0, 0, 0, 4],
               [3, 0, 0, 8, 9, 0, 1, 0, 7]];

export function printState(state) {
    for (let x = 0; x < state.length; x++) {
        let lineString = "||";
        for (let y = 0; y < state[x].length; y++) {
            switch (state[x][y]) {
                case 0: 
                    lineString += "   ";
                    break;
                default:
                    lineString += " " + state[x][y] + " ";
                    break;
            }
            if ((y+1)%3 === 0) {
                lineString += "||"
            } else {
                lineString += "|";
            }
        }
        console.log(lineString);
        if ((x+1)%3 === 0) {
            console.log("=========================================");
        } else {
            console.log("-----------------------------------------");
        }
    }
}

export function checkLegalState(state) {
    for (let x = 0; x < state.length; x ++) {
        try {
            let columnSet = new SudokuSet(state.map((row) => row[x]));
            let rowSet = new SudokuSet(state[x]);
        } catch {
            return false;
        }
    }

    let boxes = new Map();

    for (let x = 0; x < puzzle.length; x++) {
        for (let y = 0; y < puzzle[x].length; y++) {
            let rowBox = Math.floor(x/3);
            let colBox = Math.floor(y/3);

            let currBox = rowBox.toString() +"."+colBox.toString();
            let currVal = puzzle[x][y];

            if (!boxes.has(currBox)) {
                let thisSet = new SudokuSet([]);
                boxes.set(currBox, thisSet);
            }

            if (currVal > 0) {
                let thisSet = boxes.get(currBox);
                try {
                    thisSet.addItem(currVal);
                } catch {
                    return false;
                }
                boxes.set(currBox, thisSet);
            }
        }
    }
    return true;
}

function printColumn(state) {
    let column = state.map((row) => row[0]);
    console.log(column);
}

export function checkSolved(state) {
    for (let x = 0; x < state.length; x++) {
        for (let y = 0; y < state[x].length; y++) {
            if (state[x][y]===0) {
                return false;
            }
        }
    }

    checkLegalState(state);
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// console.log("\nFirst Puzzle Solution\n");
// let firstSudoku = new Sudoku(puzzle);
// let solved = firstSudoku.solve();
// console.log(solved);
// console.log("state of the original puzzle:");
// printState(puzzle);

// console.log("\nSecond Puzzle Solution\n");
// let secondSudoku = new Sudoku(puzzle2);
// let solved2 = secondSudoku.solve();
// console.log(solved2)
// console.log("state of the original puzzle:")
// printState(puzzle2);

// console.log("\nThird Puzzle Solution\n");
// let thirdSudoku = new Sudoku(puzzle3);
// let solved3 = thirdSudoku.solve();
// console.log(solved3)
// console.log("state of the original puzzle:");
// printState(puzzle3);


// for (let x = 0; x < puzzle.length; x++) {
//     let row = puzzle[x];
//     let col = puzzle.map((row) => row[x]);

//     try {
//         let rowSet = new SudokuSet(row);
//     } catch {
//         console.log("Couldn't initialise row: ", row, " to SudokuSet. Row contains duplicates.");
//     }

//     try {
//         let colSet = new SudokuSet(col);
//     } catch {
//         console.log("Couldn't initialise column: ", col, " to SudokuSet. Column contains duplicates. Column index: ", x);
//     }
// }

// console.log(puzzle.map((row) => row[5]));
// console.log(puzzle.map((row) => row[6]));
// console.log(puzzle.map((row) => row[7]));
// console.log(puzzle.map((row) => row[8]));

// try {
//     let row = puzzle.map((row) => row[5]);
//     let rowSet = new SudokuSet(row);
// } catch {
//     console.log("Couldn't initialise column: ", col, " to SudokuSet. Column contains duplicates.");
// }


// let arr = [1,2,3,4,4,5];
// let arrSet = new SudokuSet(arr);
// console.log(arrSet.items);