// Event listener for the form submission
// Targets the contact form then add an event listener to the existing function
document.getElementById("contact-form").addEventListener("submit", 
async (event) => {
  event.preventDefault();

  // Gather form data
  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    message: document.getElementById("message").value
  };

  // Send the form data to the server
  // Adding the route to await inside fetch() function and
  // Pass the data into the JSON.stringify() function
  const response = await fetch('/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  // Get the server's response
  // Adding the element ID to display server response
  const data = await response.json();

  // Display confirmation
  document.getElementById("response-message").textContent = data.confirmation;

  // Log the server's response to the console
  // Passing the variable to log the server response to the console
  console.log(data);
});