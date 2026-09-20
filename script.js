let currentSpeech = null;


function readText(id) {

  if (!("speechSynthesis" in window)) {
    alert("Read aloud is not supported by this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  currentSpeech =
    new SpeechSynthesisUtterance(element.innerText);

  currentSpeech.rate = 0.95;
  currentSpeech.pitch = 1;
  currentSpeech.volume = 1;

  window.speechSynthesis.speak(currentSpeech);
}


function stopReading() {

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

}


function searchContract() {

  const input =
    document
      .getElementById("contractSearch")
      .value
      .toLowerCase();

  const items =
    document.querySelectorAll(".contract-item");

  items.forEach(item => {

    const searchableText =
      (
        item.innerText +
        " " +
        item.dataset.search
      ).toLowerCase();

    if (searchableText.includes(input)) {
      item.style.display = "";
    }

    else {
      item.style.display = "none";
    }

  });

}


function quickSearch(term) {

  const input =
    document.getElementById("contractSearch");

  input.value = term;

  searchContract();

  input.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}
