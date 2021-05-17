const api =
  "https://cdn-api.co-vin.in/api​/v2​/appointment​/sessions​/public​/calendarByPin";

const getCurrentDate = () => {
  let currentDate = new Date();
  let dd = String(currentDate.getDate()).padStart(2, "0");
  let mm = String(currentDate.getMonth() + 1).padStart(2, "0");
  let yyyy = currentDate.getFullYear();

  currentDate = dd + "-" + mm + "-" + yyyy;
  return currentDate;
};

const searchByPin = (pincode) => {
  const currentDate = getCurrentDate();
  const params = "?pincode=" + pincode + "&date=" + currentDate;

  try {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == xhr.DONE) {
        let responseData = xhr.response;
        responseData = JSON.parse(responseData);
        responseData.centers.forEach((center) => {
          center.sessions.forEach((session) => {
            if (session.min_age_limit >= 18 && session.available_capacity > 0) {
              var audio = new Audio(
                chrome.runtime.getURL("./notification.mp3")
              );
              audio.play();

              chrome.storage.local.set({
                last_slot_found: { center: center, session: session },
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
                    "Click ok to open cowin login page"
                )
              ) {
                chrome.browserAction.onClicked.addListener(function (
                  activeTab
                ) {
                  var newURL = "https://selfregistration.cowin.gov.in/";
                  chrome.tabs.create({ url: newURL });
                });
              }
            }
          });
        });
      }
    };
    xhr.open("GET", api + params, true);
    xhr.send();
    chrome.storage.sync.set(
      { last_run: "No slots found yet. Last run on: " + new Date() },
      function () {
        console.log("Last run saved");
      }
    );
  } catch (error) {
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
  }
};