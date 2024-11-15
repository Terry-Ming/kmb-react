import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [inputRoute, setInputRoute] = useState("");
  const [fulldata, setFullData] = useState("");
  const [searchedRoute, setSearchedRoute] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [route, setRoute] = useState("");
  const [inOut, setInOut] = useState("");
  const [type, setType] = useState("");
  const [stopID, setStopID] = useState("");
  const [stops, setStops] = useState("");
  const [time, setTime] = useState("");

  const api = "https://data.etabus.gov.hk/v1/transport/kmb";

  function handleInput(ev) {
    let text = ev.target.value;
    setInputRoute(text.replaceAll(/[^a-zA-Z0-9]/g, "").toUpperCase());
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${api}/route`);
        const result = await response.json();
        setFullData(result);
        console.log(result);
      } catch (error) {
        console.log("Cant fetch data.");
      }
    };
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  function handleSearch() {
    let filteredRoutes = fulldata.data.filter((el) => el.route === inputRoute);

    setSearchedRoute(filteredRoutes);
    setIsSearched(true);
  }

  async function handleRouteSearch(selected) {
    setRoute(selected.route);
    setType(selected.service_type);
    setInOut(selected.bound === "O" ? "outbound" : "inbound");

    await fetchStopID(selected.route, inOut, selected.service_type);
  }

  async function handleETAsearch(stopID, route, type) {
    await fetchETA(stopID, route, type);
  }

  const fetchStopID = async (route, inOut, serviceType) => {
    try {
      const response = await fetch(
        `${api}/route-stop/${route}/${inOut}/${serviceType}`
      );
      const result = await response.json();
      const stopIDs = result.data.map((el) => el.stop);
      setStopID(stopIDs);
      await fetchStops(stopIDs); // Call fetchStops here
    } catch (error) {
      console.log("Can't fetch data.");
    }
  };

  const fetchStops = async (stopIDs) => {
    try {
      const stopPromises = stopIDs.map(async (id) => {
        const response = await fetch(`${api}/stop/${id}`);
        console.log();
        if (!response.ok) {
          throw new Error(`Error fetching data for stop ID: ${id}`);
        }
        const data = await response.json();
        return data.data.name_tc; // Get the name directly
      });
      const results = await Promise.all(stopPromises);
      setStops(results); // Set the stops here
    } catch (error) {
      console.log("Can't fetch data:", error);
    }
  };

  const fetchETA = async (ID, route, type) => {
    try {
      const response = await fetch(`${api}/eta/${ID}/${route}/${type}`);
      if (!response.ok) {
        throw new Error(`Error fetching data for stop ID: ${ID}`);
      }
      const data = await response.json();

      setTime(data.data.map((el) => el.eta));
      console.log(time);
    } catch (error) {
      console.log("Can't fetch data:", error);
    }
  };

  function ShowRoute({ stops, stopID, handleETAsearch }) {
    return (
      <>
        {stops.length > 0 ? (
          stops.map((stop, index) => (
            <div
              key={index}
              className="stopButton"
              stopID={stopID[index]}
              onClick={() => handleETAsearch(stopID[index], route, type)}
            >
              {stop}
            </div>
          ))
        ) : (
          <div></div>
        )}
      </>
    );
  }

  function ShowIO({ isSearched, searchedRoute, handleRouteSearch }) {
    return (
      <section className="buttonContainer">
        {isSearched &&
          (searchedRoute.length > 0 ? (
            searchedRoute.map((el, i) => (
              <div
                className="routeButton"
                key={i}
                onClick={() => handleRouteSearch(searchedRoute[i])}
              >
                由 {el.dest_tc} 至 {el.orig_tc}
              </div>
            ))
          ) : (
            <div></div>
          ))}
      </section>
    );
  }

  function ShowTime({ time }) {
    return (
      <>
        {time.length > 0 ? (
          time.map(
            (el, index) =>
              el && <div key={index}>到站時間:{el?.slice(11, 16)}</div>
          )
        ) : (
          <div>No ETA data</div>
        )}
      </>
    );
  }

  return (
    <>
      <header className="header">
        <input value={inputRoute} onChange={handleInput} maxLength={5} />
        <button className="search" onClick={() => handleSearch()}>
          Search
        </button>
        <ShowIO
          isSearched={isSearched}
          searchedRoute={searchedRoute}
          handleRouteSearch={handleRouteSearch}
        />
      </header>
      <div className="lower">
        <div className="left">
          <ShowRoute
            stops={stops}
            stopID={stopID}
            handleETAsearch={handleETAsearch}
          />
        </div>
        <div className="right">
          <ShowTime time={time} />
        </div>
      </div>
    </>
  );
}

export default App;
