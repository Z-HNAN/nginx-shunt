import React, { useEffect, useState } from "react";
import { List, Slider, Input, Button, Modal, Form, InputNumber } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import MonacoEditor from '@monaco-editor/react';

type TestProps = {
  testClients: Array<TestClient>;
  onConfirm: (testClients: Array<TestClient>) => void;
};

const Test: React.FC<TestProps> = ({ testClients, onConfirm }) => {
  const [items, setItems] = useState(testClients);
  React.useEffect(() => setItems(testClients), [testClients]);
  
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [modalVisible, setModalVisible] = useState(false);

  const [form] = Form.useForm();

  const handleAddItem = () => {
    setItems([
      ...items,
      { key: `env_${items.length + 1}`, config: '' },
    ]);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleEditItem = (index: number) => {
    setSelectedItemIndex(index);
    setModalVisible(true);
    form.setFieldsValue(items[index])
  };

  const handleModalOk = () => {
    setItems([
      ...items.slice(0, selectedItemIndex),
      form.getFieldsValue(),
      ...items.slice(selectedItemIndex + 1)
    ]);
    setModalVisible(false);
  }

  const handleConfirm = () => {
    onConfirm(items);
  }

  return (
    <div className="test">
      <style jsx global>{`
        #test_form .ant-col-offset-32 .ant-form-item-control-input-content {
          height: 200px !important;
        }
      `}</style>
      <h2>Test ENV</h2>
      <List
        dataSource={items}
        renderItem={(item, index) => (
          <List.Item>
            {item.key}{" "}
            <Button onClick={() => handleEditItem(index)}>Edit</Button>{" "}
            <Button onClick={() => handleDeleteItem(index)} disabled={item.key === 'prod'}>Delete</Button>
          </List.Item>
        )}
      />
      <Button
        style={{ marginRight: 20 }}
        type="dashed"
        onClick={handleAddItem}
        icon={<PlusOutlined />}
      >
        Add
      </Button>
      <Button type="primary" onClick={handleConfirm}>
        Submit
      </Button>

      {modalVisible && (
        <Modal
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleModalOk}
        >
          <Form
            form={form}
            name="test_form"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              label="env name"
              name="key"
              rules={[{ required: true, message: 'Please input env name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              wrapperCol={{ offset: 32 }}
              name="config"
              rules={[{ required: true, message: 'Please input config!' }]}
            >
              <MonacoEditor
                defaultLanguage="conf"
                theme="vs"
                options={{
                  minimap: { enabled: false}
                }}
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default Test;
