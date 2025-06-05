import './App.css';
import TimePicker from "./components/TimePicker"
import { useState } from 'react';

function App() {
const [timeValue, setTimeValue] = useState("12:00"); 
  console.log('timeValue: ', timeValue);

  const handleTimeChange = (value: string) => {
    setTimeValue(value);
    console.log("Selected time:", value);
  };

  return (
    <>
      <TimePicker
        value={timeValue}
        onChange={handleTimeChange}
        color="red"
        use24Hour={true}
        label="Select Time"
        placeholder="Choose your time"
        // Optional props you can use:
        disabled={false}
        // error={false}
        // touched={false}
        // isRequired={true}
        // errorMessage="Please select a time"
      />
    </>
  )
}

export default App