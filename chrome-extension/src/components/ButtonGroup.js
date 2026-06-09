import React, { useState } from "react";
import { default as FloatButton } from "antd/es/float-button/index";
import { PlusOutlined, DiffOutlined } from "@ant-design/icons";
import AddEntryModal from "./AddEntryModal";
import CreateSheetModal from "./CreateSheetModal";

import "../style.css";

const ButtonGroup = ({ visitSheet, createSheet, spreadsheetUrl }) => {
  const [modal, setModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);

  const openModal = () => {
    setModal(true);
  };
  const getTooltip = () => {
    let tooltip = "";
    if (spreadsheetUrl.length > 0) {
      tooltip = "Visit Sheet";
    } else {
      tooltip = "Create Sheet";
    }
    return tooltip;
  };
  const createVisitSheet = () => {
    if (spreadsheetUrl.length > 0) {
      visitSheet();
    } else {
      setCreateModal(true);
    }
  };
  return (
    <>
      <FloatButton.Group shape="square" style={{ bottom: 15, right: 15 }}>
        <FloatButton
          icon={<DiffOutlined />}
          tooltip="New spreadsheet"
          onClick={() => setCreateModal(true)}
        ></FloatButton>
        <FloatButton
          tooltip={getTooltip()}
          onClick={createVisitSheet}
        ></FloatButton>
        <FloatButton
          tooltip="Add entry"
          icon={<PlusOutlined />}
          onClick={openModal}
        ></FloatButton>
      </FloatButton.Group>
      <AddEntryModal modal={modal} setModal={setModal} />
      <CreateSheetModal
        modal={createModal}
        setModal={setCreateModal}
        createSheet={createSheet}
      />
    </>
  );
};

export default ButtonGroup;
