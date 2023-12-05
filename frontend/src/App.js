import "./App.css";
import { useState, useRef, useEffect } from "react";
import axios from "axios";

function App() {
  const [itemWeights, setItemWeights] = useState([]);
  const [itemValues, setItemValues] = useState([]);
  const [bucket, setBucket] = useState(0);
  const [knapsackData, setKnapsackData] = useState([]);

  const weightsRef = useRef(null);
  const valuesRef = useRef(null);
  const bucketRef = useRef(null);

  function changeItemWeights() {
    const newWeights = weightsRef.current.value
      .split(",")
      .map((val) => parseInt(val.trim()));

    setItemWeights(newWeights);
  }

  function changeItemValues() {
    const newValues = valuesRef.current.value
      .split(",")
      .map((val) => parseInt(val.trim()));

    setItemValues(newValues);
  }

  function changeBucketSize() {
    setBucket(parseInt(bucketRef.current.value));
  }

  function clearInputs() {
    setItemWeights([]);
    setItemValues([]);
  }

  async function calculate() {
    try {
      // Check if item values and item weights lengths match
      if (itemValues.length !== itemWeights.length) {
        console.error("Item values and item weights lengths must match.");
        return;
      }

      const response = await axios.post("http://localhost:3001/insert", {
        item_weights: itemWeights,
        item_values: itemValues,
        capacity: bucket,
      });

      console.log("Knapsack data sent successfully", response.data);
      fetchKnapsackData();
    } catch (error) {
      console.error("Error calculating knapsack:", error.message);
    }
  }

  async function fetchKnapsackData() {
    try {
      const response = await axios.get("http://localhost:3001/data");
      setKnapsackData(response.data);
    } catch (error) {
      console.error("Error fetching knapsack data:", error.message);
    }
  }

  useEffect(() => {
    fetchKnapsackData();
  }, []);

  return (
    <div className="App">
      <div>
        <div className="wrapper">
          <svg>
            <text x="50%" y="28%" dy=".35em" textAnchor="middle">
              KNAPSACK ALGO
            </text>
          </svg>
        </div>

        <input
          ref={weightsRef}
          type="text"
          placeholder="Enter Item Weights (comma-separated)"
        ></input>
        <button onClick={changeItemWeights}>Set Item Weights</button>
      </div>
      <div>
        <input
          ref={valuesRef}
          type="text"
          placeholder="Enter Item Values (comma-separated)"
        ></input>
        <button onClick={changeItemValues}>Set Item Values</button>
      </div>
      <div>
        <input
          ref={bucketRef}
          type="number"
          placeholder="Enter Bucket Size"
        ></input>
        <button onClick={changeBucketSize}>Change</button>
      </div>
      <h1>Current Weights:</h1>
      {itemWeights.map((weight, index) => (
        <label key={index}>
          {weight} {index < itemWeights.length - 1 ? "," : ""}
        </label>
      ))}
      <h1>Current Values:</h1>
      {itemValues.map((value, index) => (
        <label key={index}>
          {value} {index < itemValues.length - 1 ? "," : ""}
        </label>
      ))}
      <h1>Max Bucket Size:</h1>
      <h3>{bucket}</h3>
      <button onClick={calculate}>Save To Database</button>
      <button onClick={clearInputs}>Clear</button>

{/* Code for creating table */}
      <h1>Knapsack Data:</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Item Weights</th>
            <th>Item Values</th>
            <th>Capacity</th>
            <th>Greedy Solution</th>
            <th>Dynamic Solution</th>
            <th>Branch and Bound Solution</th>
          </tr>
        </thead>
        <tbody>
          {knapsackData.map((data) => (
            <tr key={data.id}>
              <td>{data.id}</td>
              <td>{JSON.parse(data.item_weights).join(", ")}</td>
              <td>{JSON.parse(data.item_values).join(", ")}</td>
              <td>{data.capacity}</td>
              <td>{JSON.parse(data.greedy_solution).join(", ")}</td>
              <td>{JSON.parse(data.dynamic_solution).join(", ")}</td>
              <td>{data.branch_bound_solution}</td> {/* Use the value directly */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;