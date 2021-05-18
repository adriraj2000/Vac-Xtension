const api =
  "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin";

const getToday = () => {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();

  today = dd + "-" + mm + "-" + yyyy;
  return today;
};

const sendHttpRequest = (method, url, data) => {
  return fetch(url, {
    method: method,
    body: JSON.stringify(data),
    headers: data ? { "Content-Type": "application/json" } : {},
  }).then((response) => {
    if (response.status >= 400) {
      // !response.ok
      return response.json().then((errResData) => {
        chrome.storage.sync.set(
          {
            last_run:
              "There was an error in the last check. No slots found yet. Last run on: " +
              new Date(),
          },
          function () {
            console.log("Last run saved");
          }
        );
      });
    }
    return response.json();
  });
};

// searching slots by pin code
// this function exists in the popup script too
// need to find a way to make this modular
// not able to find backgound using popup function
const searchForStock = (pin) => {
  const today = getToday();
  const params = "?pincode=" + pin + "&date=" + today;
  let url = api + params;
  sendHttpRequest("GET", url).then((responseData) => {
    responseData.centers.forEach((center) => {
      center.sessions.forEach((session) => {
        if (session.min_age_limit >= 18 && session.available_capacity > 0) {
          var myAudio = new Audio(chrome.runtime.getURL("/notification.mp3"));
          myAudio.play();

          chrome.storage.sync.set({
            last_found_slot: { center: center, session: session },
          });
          if (
            window.confirm(
              "A new slot was found!" +
                "\n" +
                center.name +
                " (" +
                session.available_capacity +
                ") " +
                " - on " +
                session.date +
                " - " +
                session.vaccine +
                " (" +
                center.fee_type +
                ")" +
                "\n" +
                "Click ok to open covin login page"
            )
          ) {
            chrome.browserAction.onClicked.addListener(function (activeTab) {
              chrome.tabs.create({
                url: "https://selfregistration.cowin.gov.in/",
              });
            });
          }
        }
      });
    });
    chrome.storage.sync.set(
      { last_run: "No slots found yet. Last run on: " + new Date() },
      function () {
        console.log("Last run saved");
      }
    );
  });
};

chrome.alarms.onAlarm.addListener(function (alarm) {
  chrome.storage.sync.get(["pin_code"], function (items) {
    if (items) {
      if (items.pin_code) searchForStock(items.pin_code);
    }
  });
});
