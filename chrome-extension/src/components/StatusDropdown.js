import React from "react";
import { default as Button } from "antd/es/button/index";
import { default as Dropdown } from "antd/es/dropdown/index";
import { default as Menu } from "antd/es/menu/index";
import "../style.css";

const items = [
  {
    key: "",
    label: "All",
  },
  {
    key: "rejection",
    label: "Rejection",
  },
  {
    key: "pending",
    label: "Pending",
  },
  {
    key: "moving on",
    label: "Moving On",
  },
];

const StatusDropdown = ({ onStatusSelect, status }) => {
  const handleMenuClick = (e) => {
    onStatusSelect(e.key);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      {items.map((item) => (
        <Menu.Item key={item.key}>{item.label}</Menu.Item>
      ))}
    </Menu>
  );

  const buttonText = status || "Filter by status";
  const buttonStyle = {
    width: "100%",
    color: !status ? "#d9d9d9" : "rgba(0, 0, 0, 0.85)", // lighter gray when "All" is selected type shit
    transition: "none",
  };

  return (
    <Dropdown overlay={menu} placement="bottomLeft">
      <Button style={buttonStyle}>{buttonText}</Button>
    </Dropdown>
  );
};

export default StatusDropdown;
