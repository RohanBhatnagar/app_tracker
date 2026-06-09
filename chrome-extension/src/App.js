import React, { useState } from "react";
import { useEffect } from "react";

import "./style.css";
import Home from "./components/home.js";
import Navigation from "./components/Navigation";
import axiosInstance from "./api/axiosInstance.js";
import { setAuthTokens } from "./api/tokenStorage";
import ButtonGroup from "./components/ButtonGroup";
import { BACKEND_API_BASE_URL } from "./config/env";
import { getAuthToken, getProfileUserInfo } from "./lib/chromeApi";

const App = () => {
  const [email, setEmail] = useState("");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [status, setStatus] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);

  const handleAuthorize = async () => {
    try {
      const authToken = await getAuthToken({ interactive: true });
      const userInfo = await getProfileUserInfo({ accountStatus: "ANY" });
      const nextEmail = userInfo.email;
      const loginResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: nextEmail }),
      });

      if (!loginResponse.ok) {
        throw new Error("Failed to create backend session.");
      }

      const { access_token: accessToken, refresh_token: refreshToken } =
        await loginResponse.json();

      await setAuthTokens({ accessToken, refreshToken });

      setStatus(`Authorized successfully! Email: ${nextEmail}`);
      setEmail(nextEmail);
      setGoogleToken(authToken);

      try {
        const res = await axiosInstance.get(`/protected/user/${nextEmail}`, {});
        const user = res.data;
        setSpreadsheetUrl(user.spreadsheetUrl);
      } catch {
        try {
          const body = {
            email: nextEmail,
            spreadsheetUrl: "",
            spreadsheetId: "",
            lastChecked: Date.now(),
          };
          await axiosInstance.post(`/protected/user/add`, body);
        } catch (error) {
          console.error(error);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  // authorize on mount
  useEffect(() => {
    const authorize = async () => {
      await handleAuthorize();
      setAuthorized(true);
    };
    authorize();
    return () => {};
  }, []);
  // create spreadsheet
  const createSheet = async (title) => {
    try {
      const authToken = await getAuthToken({ interactive: true });
      // create sheet
      const response = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              title: title,
            },
          }),
        }
      );
      const data = await response.json();
      const sheetId = data.sheets[0].properties.sheetId;
      const values = [["Date", "Company", "Role", "Status", "Link"]];
      const appendResponse = await appendValues(
        data.spreadsheetId,
        "Sheet1!A1:E1",
        "RAW",
        values,
        authToken
      );
      await applyConditionalFormatting(sheetId, data.spreadsheetId, authToken);
      setSpreadsheetUrl(data.spreadsheetUrl);
      extractSpreadsheetId(data.spreadsheetUrl);
      // update database on create
      try {
        await axiosInstance.put(`/protected/user/${email}`, {
          spreadsheetUrl: data.spreadsheetUrl,
          spreadsheetId: data.spreadsheetId,
        });
        console.log("Spreadsheet updated on Mongo");
      } catch (error) {
        console.error("Error updating mongo:", error);
      }
      console.log("Spreadsheet created and headers declared.");
      return appendResponse;
    } catch (error) {
      console.error("Error:", error);
      setStatus("Failed to create spreadsheet.");
    }
  };
  // open sheet in new tab
  const visitSheet = async () => {
    window.open(spreadsheetUrl, "_blank");
  };
  // helper functions
  const appendValues = async (
    spreadsheetId,
    range,
    valueInputOption,
    values,
    authToken
  ) => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=${valueInputOption}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: values,
          }),
        }
      );
      const result = await response.json();
      // console.log("RESULT", result);
      return result;
    } catch (err) {
      console.error("Error appending values:", err);
      throw err;
    }
  };
  // get id from url
  const extractSpreadsheetId = async (url) => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
      console.log(match[1]);
    } else {
      return "Invalid";
    }
  };
  async function applyConditionalFormatting(sheetId, spreadsheetId, token) {
    const requestBody = {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetId,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [
                {
                  sheetId: sheetId,
                  startRowIndex: 1,
                  startColumnIndex: 3,
                  endColumnIndex: 4,
                },
              ],
              booleanRule: {
                condition: {
                  type: "CUSTOM_FORMULA",
                  values: [{ userEnteredValue: '=D2="pending"' }],
                },
                format: {
                  backgroundColor: { red: 1.0, green: 1.0, blue: 168 / 255 },
                },
              },
            },
            index: 0,
          },
        },
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [
                {
                  sheetId: sheetId,
                  startRowIndex: 1,
                  startColumnIndex: 3,
                  endColumnIndex: 4,
                },
              ],
              booleanRule: {
                condition: {
                  type: "CUSTOM_FORMULA",
                  values: [{ userEnteredValue: '=D2="moving on"' }],
                },
                format: {
                  backgroundColor: {
                    red: 160 / 255,
                    green: 233 / 255,
                    blue: 160 / 255,
                  },
                },
              },
            },
            index: 1,
          },
        },

        {
          addConditionalFormatRule: {
            rule: {
              ranges: [
                {
                  sheetId: sheetId,
                  startRowIndex: 1,
                  startColumnIndex: 3,
                  endColumnIndex: 4,
                },
              ],
              booleanRule: {
                condition: {
                  type: "CUSTOM_FORMULA",
                  values: [{ userEnteredValue: '=D2="rejection"' }],
                },
                format: {
                  backgroundColor: {
                    red: 1.0,
                    green: 156 / 255,
                    blue: 156 / 255,
                  },
                },
              },
            },
            index: 2,
          },
        },
      ],
    };
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Conditional formatting applied:", data);
    } else {
      const error = await response.json();
      console.error("Error applying conditional formatting:", error);
    }
  }
  const [currentPage, setCurrentPage] = useState("recents");
  const renderPage = () => {
    switch (currentPage) {
      case "recents":
        return <Home token={googleToken} email={email} />;
      default:
        return null;
    }
  };

  return (
    <div class="wrapper">
      <header class="header">
        {/* <div class="header-container">
          <Image preview={false} width={30} src="../../images/Logo.png"></Image>
          <Typography.Text className="headerName">Job Tracker</Typography.Text>
        </div> */}
        <div class="header-menu">
          <Navigation
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          ></Navigation>
        </div>
      </header>
      <div className="page-content">{renderPage()}</div>
      <ButtonGroup
        createSheet={createSheet}
        visitSheet={visitSheet}
        spreadsheetUrl={spreadsheetUrl}
      ></ButtonGroup>
    </div>
  );
};

export default App;
