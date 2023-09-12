import React, { useState } from "react";
import { Form, Input, InputNumber, Button, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const colors = [
  "#1f77b4", // 蓝色
  "#ff7f0e", // 橙色
  "#2ca02c", // 绿色
  "#d62728", // 红色
  "#9467bd", // 紫色
  "#8c564b", // 棕色
  "#e377c2", // 粉红色
  "#7f7f7f", // 灰色
  "#bcbd22", // 黄绿色
  "#17becf", // 青色
];

type GrayProps = {
  grayClients: Array<GrayClient>;
  onConfirm: (clients: Array<GrayClient>) => void;
}

const Gray: React.FC<GrayProps> = ({ grayClients, onConfirm }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue({gray_clients: grayClients })
  }, [grayClients]);

  const handleFormFinish = () => {
    const garyClients = form.getFieldsValue()['gray_clients']
    const prodPercent = 100 - garyClients.slice(1).reduce((sum: number, client: any) => sum + client.percent, 0)
    if (prodPercent < 0) {
      form.setFields([
        {
          name: ['gray_clients', 0, 'percent'],
          errors: ['所有流量加和需要为100'],
        },
      ]);
      return
    }

    form.setFields([
      {
        name: ['gray_clients', 0, 'percent'],
        value: prodPercent
      },
    ]);

    onConfirm(form.getFieldsValue()['gray_clients']);
  }

  return (
    <div className="gray">
      <h2 style={{ marginBottom: 12 }}>Gray ENV</h2>
      <Form form={form} name="gray_from" onFinish={handleFormFinish}>
        <Form.List name="gray_clients">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="start"
                >
                  <Form.Item
                    {...restField}
                    name={[name, 'key']}
                    rules={[{ required: true, message: "请输入名称" }]}
                    style={{ marginBottom: 12 }}
                  >
                    <Input disabled={name === 0} placeholder="key" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'percent']}
                    rules={[{ required: true, message: "请输入流量占比" }]}
                    style={{ marginBottom: 12 }}
                  >
                    <InputNumber disabled={name === 0} min={0} max={100} placeholder="percent" />
                  </Form.Item>
                  {name !== 0 && <MinusCircleOutlined onClick={() => remove(name)} />}
                </Space>
              ))}
              <Form.Item>
                <Button
                  style={{ marginRight: 20 }}
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                  Add
                </Button>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </div>
  );
};

export default Gray;
