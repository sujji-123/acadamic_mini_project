import axios from "axios";

export async function checkAvailability(data) {
  try {
    const res = await axios.post("http://localhost:8000/predict", data);
    return res.data.available;
  } catch {
    return 1;
  }
}