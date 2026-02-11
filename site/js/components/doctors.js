fetch('components/doctors.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('doctors-placeholder').innerHTML = data;
  });