import React from "react";
import { default as Input } from "antd/es/input/index";
import { default as notification } from "antd/es/notification/index";
import { default as Button } from "antd/es/button/index";
import { default as Form } from "antd/es/form/index";
import { default as Modal } from "antd/es/modal/index";

import "../style.css";

const CreateSheetModal = ({ modal, setModal, createSheet }) => {
  const [form] = Form.useForm();
  const onFinish = (values) => {
    console.log("Creating sheet with title: ", values.title);
    createSheet(values.title);
    notification.success({
      message: "Success",
      description: "New sheet created!",
    });
    setModal(false);
  };
  const handleCancel = () => {
    setModal(false);
  };
  return (
    <Modal
      title="Create new sheet."
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
      <p>
        All future updates will be reflected in this spreadsheet. This action is
        irreversible.
      </p>
      <Form form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default CreateSheetModal;
