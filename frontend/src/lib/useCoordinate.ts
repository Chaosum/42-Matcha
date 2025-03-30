import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  access: boolean;
}

export function useCoordinate(): UserCoordinates {
  const [locationData, setLocationData] = useState<UserCoordinates>({
    latitude: 0,
    longitude: 0,
    access: false,
  });

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  function success(pos: GeolocationPosition) {
    if (!pos.coords) return;

    const crd: UserCoordinates = {
      access: true,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };

    setLocationData(crd);
  }

  async function errors(err: GeolocationPositionError) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    await getLocation();
  }

  async function getLocation() {
    // it will return the following attributes:
    // country, countryCode, regionName, city, lat, lon, zip and timezone
    const res = await axios.get("http://ip-api.com/json");
    console.log(res);
    if (res.status === 200) {
      const out: UserCoordinates = {
        access: false,
        latitude: res.data.lat,
        longitude: res.data.lon,
      };
      setLocationData(out);
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then(function (result) {
          console.log(result);
          if (result.state === "granted") {
            navigator.geolocation.getCurrentPosition(success, errors, options);
          } else if (result.state === "prompt") {
            navigator.geolocation.getCurrentPosition(success, errors, options);
          } else if (result.state === "denied") {
            console.log("Location access denied.");
            // with ip address
            getLocation().then((r) => console.log(r));
          }
        });
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  return locationData;
}

export async function GetCoordinates(address: string) {
  const parsedAddress = address.replace(/ /g, "+");

  console.log("GetCoordinates:", parsedAddress);
  const reverseGeocoding = await axios.get(
    `http://nominatim.openstreetmap.org/search?q=${parsedAddress}&format=jsonv2`
  );

  if (reverseGeocoding.data.length === 0) return;

  const { lat, lon } = reverseGeocoding.data[0] as {
    lat: string;
    lon: string;
  };

  console.log("NEW CORD", lat.substring(0, 10), lon.substring(0, 10));
  const latitude = parseFloat(lat.substring(0, 10));
  const longitude = parseFloat(lon.substring(0, 10));
  if (isNaN(latitude) || isNaN(longitude)) {
    return;
  }
  return { access: false, latitude, longitude };
}

export async function GetAddressFromCoordinates(lat: number, lon: number) {
  if (!lat || !lon) {
    return;
  }
  console.log("GetAddressFromCoordinates:", lat, lon);

  const reverseGeocoding = await axios.get(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat.toString()}&lon=${lon.toString()}&format=jsonv2`
  );
  const { house_number, city, postcode, road, suburb, town, village } =
    reverseGeocoding.data.address;
  const displayLocation = `${house_number ? `${house_number},` : ""} ${road}, ${suburb ? `${suburb},` : ""}${postcode}, ${city || town || village}`;

  console.log(displayLocation);
  return displayLocation;
}

export async function GetAddressFromString(coordinates: string) {
  if (!coordinates) {
    return;
  }

  const [lat, lon] = coordinates.split(",");

  return await GetAddressFromCoordinates(parseFloat(lat), parseFloat(lon));
}
