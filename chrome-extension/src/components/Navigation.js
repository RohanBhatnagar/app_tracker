import React from "react";
import { default as Menu } from "antd/es/menu/index";
import {
  ClockCircleOutlined,
  UsergroupAddOutlined,
  FundViewOutlined,
  FileExclamationOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const pages = [
  {
    label: "Recents",
    key: "recents",
    icon: <ClockCircleOutlined />,
  },
  {
    label: "Referrals",
    key: "referrals",
    icon: <UsergroupAddOutlined />,
    disabled: true
  },
  {
    label: "Assessments",
    key: "assessments",
    icon: <FileExclamationOutlined />,
    disabled: true,
  },
  {
    label: "Metrics",
    key: "metrics",
    icon: <FundViewOutlined />,
    disabled: true,
  },
  {
    label: "Settings",
    key: "settings",
    icon: <SettingOutlined />,
    disabled: true,
  },
];

const Navigation = ({ currentPage, setCurrentPage }) => {
  const setPage = (e) => {
    setCurrentPage(e.key);
  };
  return (
    <Menu
      onClick={setPage}
      selectedKeys={[currentPage]}
      mode="horizontal"
      items={pages}
    />
  );
};

export default Navigation;
