document.getElementById('myForm').addEventListener('submit', function(e) {
	e.preventDefault();
	const message = document.getElementById('message').value;
	document.getElementById('result').innerText = "Bạn vừa nhập: " + message;
});