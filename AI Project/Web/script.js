document.getElementById("predictionForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const symptoms = document.getElementById("symptoms").value;
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms })
    });
    const result = await response.json();
    document.getElementById("predictedDisease").textContent = result.prediction;
    document.getElementById("result").style.display = "block";
  });
  