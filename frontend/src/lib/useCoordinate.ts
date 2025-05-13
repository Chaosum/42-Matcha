import axios from "axios";
import {useEffect} from "react";
import {useState} from "react";
import {logger} from "@/lib/logger.ts";

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

    logger.log(pos.coords);

    const crd: UserCoordinates = {
      access: true,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };

    setLocationData(crd);
  }

  async function errors(err: GeolocationPositionError) {
    console.warn(`${err.code}): ${err.message}`);
    await getLocation();
  }

  async function getLocation() {
    // it will return the following attributes:
    // country, countryCode, regionName, city, lat, lon, zip and timezone
    const res = await axios.get("http://ip-api.com/json");
    if (res.status === 200) {
      const out: UserCoordinates = {
        access: true,
        latitude: res.data.lat,
        longitude: res.data.lon,
      };
      setLocationData(out);
      logger.log("Getlocations: ", out);
      return out;
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions
      .query({name: "geolocation"})
      .then(function (result) {
        logger.log(result);
        if (result.state === "granted") {
          navigator.geolocation.getCurrentPosition(success, errors, options);
        } else if (result.state === "prompt") {
          navigator.geolocation.getCurrentPosition(success, errors, options);
        } else if (result.state === "denied") {
          logger.log("Location access denied.");
          // with ip address
          getLocation().then((r) => {
            logger.log(r);
          }).catch((e) => logger.log(e));
        }
      });
    } else {
      logger.log("Geolocation is not supported by this browser.");
    }
  }, []);

  return locationData;
}

export async function GetCoordinates(address: string) {
  if (!address || address.length === 0) {
    return;
  }

  const parsedAddress = address.replace(/ /g, "+");

  logger.log("GetCoordinates:", parsedAddress);
  const reverseGeocoding = await axios.get(
    `https://api-adresse.data.gouv.fr/search/?q=${parsedAddress}`
  );

  if (reverseGeocoding.status !== 200) {
    logger.log("Error: ", reverseGeocoding.status);
    return null;
  }

  if (reverseGeocoding.data.features.length === 0) {
    logger.log("No results found");
    return null;
  }

  logger.log("GetCoordinates:", reverseGeocoding.data.features[0].geometry.coordinates);
  const longitude = reverseGeocoding.data.features[0].geometry.coordinates[1];
  const latitude = reverseGeocoding.data.features[0].geometry.coordinates[0];

  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }
  return {access: false, latitude, longitude};
}

export async function GetAddressFromCoordinates(lat: number, lon: number) {
  if (!lat || !lon) {
    return;
  }
  logger.log("GetAddressFromCoordinates:", lat, lon);

  const reverseGeocoding = await axios.get(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat.toString()}&lon=${lon.toString()}&format=jsonv2`
  );
  const {house_number, city, postcode, road, suburb, town, village} =
    reverseGeocoding.data.address;
  const displayLocation = `${house_number ? `${house_number},` : ""} ${road}, ${suburb ? `${suburb},` : ""}${postcode}, ${city || town || village}`;

  logger.log(displayLocation);
  return displayLocation;
}

export async function GetAddressFromString(coordinates: string) {
  if (!coordinates) {
    return;
  }

  const [lat, lon] = coordinates.split(",");

  return await GetAddressFromCoordinates(parseFloat(lat), parseFloat(lon));
}
