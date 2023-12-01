const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
const port = 3001;

app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Saifoo7223",
  database: "knapsack",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS knapsack_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_weights TEXT NOT NULL,
    item_values TEXT NOT NULL,
    capacity INT NOT NULL,
    greedy_solution TEXT,
    dynamic_solution TEXT,
    branch_bound_solution TEXT
  )
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.error("Error creating table:", err);
  }
});

app.use(express.json());



function solveKnapsackGreedy(itemWeights, itemValues, capacity) {
  const n = itemWeights.length;
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({ index: i, weight: itemWeights[i], value: itemValues[i] });
  }

  items.sort((a, b) => b.value / b.weight - a.value / a.weight);

  let currentWeight = 0;
  let totalValue = 0;
  const selectedItems = [];

  for (let i = 0; i < n; i++) {
    if (currentWeight + items[i].weight <= capacity) {
      selectedItems.push(items[i].index);
      currentWeight += items[i].weight;
      totalValue += items[i].value;
    }
  }

  return selectedItems;
}
function solveKnapsackDynamic(itemWeights, itemValues, capacity) {
  const n = itemWeights.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (itemWeights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - itemWeights[i - 1]] + itemValues[i - 1]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const selectedItems = [];
  let w = capacity;
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedItems.push(i - 1);
      w -= itemWeights[i - 1];
    }
  }

  return selectedItems.reverse();
}
class Node {
  constructor(level, profit, weight, bound, path) {
    this.level = level;
    this.profit = profit;
    this.weight = weight;
    this.bound = bound;
    this.path = path;
  }
}

class KnapsackNode {
  constructor(items, value, weight) {
    this.items = items;
    this.value = value;
    this.weight = weight;
  }
}

class Item {
  constructor(value, weight) {
    this.value = value;
    this.weight = weight;
    this.ratio = value / weight;
  }
}

class Knapsack {
  constructor(maxWeight, items) {
    this.maxWeight = maxWeight;
    this.items = items;
  }

  solve() {
    this.items.sort((a, b) => b.ratio - a.ratio);
    let bestValue = 0;
    const queue = [new KnapsackNode([], 0, 0)];

    while (queue.length > 0) {
      const node = queue.shift();
      const i = node.items.length;

      if (i === this.items.length) {
        bestValue = Math.max(bestValue, node.value);
      } else {
        const item = this.items[i];
        const withItem = new KnapsackNode(
          [...node.items, i],
          node.value + item.value,
          node.weight + item.weight
        );
        if (this.isPromising(withItem, this.maxWeight, bestValue)) {
          queue.push(withItem);
        }
        const withoutItem = new KnapsackNode(
          [...node.items],
          node.value,
          node.weight
        );
        if (this.isPromising(withoutItem, this.maxWeight, bestValue)) {
          queue.push(withoutItem);
        }
      }
    }

    return bestValue;
  }

  isPromising(node, maxWeight, bestValue) {
    return (
      node.weight <= maxWeight &&
      node.value + this.getBound(node) > bestValue
    );
  }

  getBound(node) {
    let remainingWeight = this.maxWeight - node.weight;
    let bound = node.value;

    for (let i = node.items.length; i < this.items.length; i++) {
      const item = this.items[i];

      if (remainingWeight >= item.weight) {
        bound += item.value;
        remainingWeight -= item.weight;
      } else {
        bound += remainingWeight * item.ratio;
        break;
      }
    }

    return bound;
  }
}

function solveKnapsackBranchAndBound(itemWeights, itemValues, capacity) {
  const n = itemWeights.length;
  const items = [];

  // Create items array with weight, value, and value-to-weight ratio
  for (let i = 0; i < n; i++) {
    items.push(new Item(itemValues[i], itemWeights[i]));
  }

  const knapsack = new Knapsack(capacity, items);
  return knapsack.solve();
}


function calculateBound(node, items, capacity) {
  let bound = node.profit;

  let currentWeight = node.weight;
  let currentIndex = node.level;

  while (
    currentIndex < items.length &&
    currentWeight + items[currentIndex].weight <= capacity
  ) {
    bound += items[currentIndex].value;
    currentWeight += items[currentIndex].weight;
    currentIndex++;
  }

  if (currentIndex < items.length) {
    bound += (capacity - currentWeight) * items[currentIndex].ratio;
  }

  return bound;
}

app.post("/insert", (req, res) => {
  const { item_weights, item_values, capacity } = req.body;

  if (!item_weights || !item_values || !capacity) {
    return res
      .status(400)
      .json({ error: "item_weights, item_values, and capacity are required" });
  }

  // Calculate solutions using different algorithms
  const greedySolution = solveKnapsackGreedy(
    item_weights,
    item_values,
    capacity
  );
  const dynamicSolution = solveKnapsackDynamic(
    item_weights,
    item_values,
    capacity
  );
  const branchBoundSolution = solveKnapsackBranchAndBound(
    item_weights,
    item_values,
    capacity
  );

  const insertKnapsackDataQuery =
    "INSERT INTO knapsack_data (item_weights, item_values, capacity, greedy_solution, dynamic_solution, branch_bound_solution) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    insertKnapsackDataQuery,
    [
      JSON.stringify(item_weights),
      JSON.stringify(item_values),
      capacity,
      JSON.stringify(greedySolution),
      JSON.stringify(dynamicSolution),
      JSON.stringify(branchBoundSolution),
    ],
    (err, result) => {
      if (err) {
        console.error("Error inserting knapsack data:", err);
        return res.status(500).json({ error: "Error inserting knapsack data" });
      }

      // Respond with the inserted knapsack data's ID
      res.json({ id: result.insertId });
    }
  );
});

app.get("/data", (req, res) => {
  const getKnapsackDataQuery = "SELECT * FROM knapsack_data";
  db.query(getKnapsackDataQuery, (err, results) => {
    if (err) {
      console.error("Error fetching knapsack data:", err);
      return res.status(500).json({ error: "Error fetching knapsack data" });
    }

    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

