import React from "react";
import { default as Input } from "antd/es/input/index";
import { default as notification } from "antd/es/notification/index";
import { default as Button } from "antd/es/button/index";
import { default as Form } from "antd/es/form/index";
import { default as Select } from "antd/es/select/index";
import { default as Modal } from "antd/es/modal/index";
import "../style.css";

const AddEntryModal = ({ modal, setModal }) => {
  const [form] = Form.useForm();
  const onFinish = (values) => {
    let role = values.role;
    let company = values.company;
    let status = values.status;
    const data = {
      role: role,
      company: company,
      status: status,
      link: null,
    };
    chrome.runtime.sendMessage(
      { action: "MANUAL_ENTRY", data: data },
      (response) => {
        if (response && response.success) {
          console.log("Application added successfully!");
          notification.success({
            message: "Success",
            description: "Application added successfully!",
          });
        } else {
          console.log("Failed to add application.");
          notification.success({
            message: "Error",
            description: "Failed to add application.",
          });
        }
      }
    );

    setModal(false);
  };
  const handleCancel = () => {
    setModal(false);
  };
  return (
    <Modal
      title="Add Application"
      open={modal}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="default" onClick={form.submit}>
          Submit
        </Button>,
      ]}
    >
      <p>Enter company, role, status.</p>
      <Form form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item name="company" rules={[{ required: true }]}>
          <Input placeholder="Company" />
        </Form.Item>
        <Form.Item name="role" rules={[{ required: true }]}>
          <Input placeholder="Role" />
        </Form.Item>
        <Form.Item name="status" rules={[{ required: true }]}>
          <Select placeholder="Pending">
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="rejection">Rejection</Select.Option>
            <Select.Option value="moving on">Moving On</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default AddEntryModal;
