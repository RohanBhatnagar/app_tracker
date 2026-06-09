import React, { useState, useEffect, useRef } from "react";
import { default as Dropdown } from "antd/es/dropdown/index";
import { default as Menu } from "antd/es/menu/index";
import { default as Typography } from "antd/es/typography/index";
import { default as Tag } from "antd/es/tag/index";
import { default as Table } from "antd/es/table/index";
import { default as Input } from "antd/es/input/index";
import { default as Popconfirm } from "antd/es/popconfirm/index";
import { default as notification } from "antd/es/notification/index";


import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import "../style.css";
import StatusDropdown from "./StatusDropdown";

const Recents = ({ cards }) => {
  const [jobs, setJobs] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const tableRef = useRef(null);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
  };

  const onStatusSelect = (key) => {
    setStatus(key);
  };

  const handleStatusChange = (key, record) => {
    // Send the update to the backend
    const data = {
      company: record.company,
      role: record.role,
      status: key,
    };

    chrome.runtime.sendMessage(
      { action: "UPDATE_STATUS", data: data },
      (response) => {
        if (response && response.success) {
          notification.success({
            message: "Success",
            description: `Status updated for ${data.company}!`,
          });
          // Update the status of the specific job
          const updatedJobs = jobs.map((job) =>
            job.key === record.key ? { ...job, status: key } : job
          );
          setJobs(updatedJobs);
        } else {
          notification.error({
            message: "Error",
            description: "Failed to update status.",
          });
        }
      }
    );
  };

  const renderStatusDropdown = (record) => {
    const items = [
      {
        key: "pending",
        label: (
          <Tag icon={<ClockCircleOutlined />} color="gold">
            pending
          </Tag>
        ),
      },
      {
        key: "rejection",
        label: (
          <Tag icon={<CloseCircleOutlined />} color="red">
            rejection
          </Tag>
        ),
      },
      {
        key: "moving on",
        label: (
          <Tag icon={<CheckCircleOutlined />} color="green">
            moving on
          </Tag>
        ),
      },
    ];

    const menu = (
      <Menu onClick={(e) => handleStatusChange(e.key, record)} items={items} />
    );

    return (
      <Dropdown overlay={menu} trigger={["click"]}>
        <div>
          <Tag
            icon={
              record.status === "pending" ? (
                <ClockCircleOutlined />
              ) : record.status === "rejection" ? (
                <CloseCircleOutlined />
              ) : (
                <CheckCircleOutlined />
              )
            }
            color={
              record.status === "pending"
                ? "gold"
                : record.status === "rejection"
                ? "red"
                : "green"
            }
            style={{ cursor: "pointer" }}
          >
            {record.status}
          </Tag>
        </div>
      </Dropdown>
    );
  };

  useEffect(() => {
    const filtered = cards
      .map((card, idx) => ({
        key: idx,
        company: card.company,
        role: card.role,
        status: card.status,
      }))
      .filter(
        (item) =>
          (item.company.toLowerCase().includes(searchText) ||
            item.role.toLowerCase().includes(searchText)) &&
          (status === "" ? true : item.status === status)
      );
    setJobs(filtered);
  }, [cards, searchText, status]);

  const handleDelete = async (record) => {
    const data = {
      company: record.company,
      role: record.role,
    };
    setJobs(
      jobs.filter(
        (job) => job.company !== record.company && job.role !== record.role
      )
    );
    chrome.runtime.sendMessage(
      { action: "DELETE_ROW", data: data },
      (response) => {
        if (response && response.success) {
          notification.success({
            message: "Success",
            description: `Deleted application at ${data.company}!`,
          });
        } else {
          console.log("Failed to delete row.");
          notification.success({
            message: "Error",
            description: "Failed to delete row.",
          });
        }
      }
    );
  };

  const columns = [
    {
      title: "",
      key: "action",
      fixed: "right",
      render: (text, record) => (
        <Popconfirm
          title="Are you sure to delete this job?"
          onConfirm={() => handleDelete(record)}
          okText="Yes"
          cancelText="No"
        >
          <DeleteOutlined />
        </Popconfirm>
      ),
    },
    {
      title: (
        <div>
          <Input
            style={{ width: 225 }}
            placeholder="Filter by company or role..."
            value={searchText}
            onChange={handleSearch}
          />
        </div>
      ),
      dataIndex: "company",
      key: "company",
      render: (text) => (
        <>
          <div className="scrollable-cell">
            {text.split("\n").map((line, index) => (
              <Typography.Text key={index} className="tableRowCompany">
                {line}
              </Typography.Text>
            ))}
          </div>
        </>
      ),
    },
    {
      title: (
        <StatusDropdown
          onStatusSelect={onStatusSelect}
          status={status}
        />
      ),
      dataIndex: "status",
      key: "status",
      fixed: "right",
      render: (text, record) => renderStatusDropdown(record),
    },
  ];

  const handleRowHover = (record) => {
    setExpandedRowKeys([record.key]);
  };

  const handleTableLeave = () => {
    setExpandedRowKeys([]);
  };

  return (
    <>
      <div ref={tableRef} onMouseLeave={handleTableLeave}>
        <Table
          dataSource={jobs}
          bordered={true}
          columns={columns}
          scroll={true}
          size="small"
          pagination={{
            pageSize: 25,
            position: ["bottomLeft"],
          }}
          expandable={{
            expandedRowRender: (record) => (
              <Typography.Text className="tableRowRole">
                {record.role}
              </Typography.Text>
            ),
            expandedRowKeys: expandedRowKeys,
            expandIconColumnIndex: -1, // Hide the mfing expand button
          }}
          onRow={(record) => {
            return {
              onMouseEnter: () => handleRowHover(record),
              // onMouseLeave: () => handleRowLeave(),
            };
          }}
        />
      </div>
    </>
  );
};

export default Recents;
