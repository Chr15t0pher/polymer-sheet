# polymer-sheet

polymer-sheet 是一款使用 typescript 构建的类似 excel 在线表格应用。

## 数据格式

本应用中存在三种比较重要的数据格式，workbook，worksheet，cell，类似于sheetjs。

### worksheet

| 属性名 | 数据类型 | 描述 |
| :------ | :------: | :------ |
| id | string | 表格的唯一标识 |
| cells | array | 二维数组，每个单元格的数据 |
| merges | array | 合并的单元格 |
| defaultRowHeight | number | cell 默认行高 |
| defaultColWidth | number | column 默认列宽 |
| rowsHeightMap | object | 用户定义的每行高度 |
| colsWidthMap | object | 用户定义的每列宽度 |
| rowsHidden | array | 隐藏行 |
| colsHidden | array | 隐藏列 |
| scrollTop | number | 表格向上滚动高度 |
| scrollLeft | number | 表格向左滚动宽度 |

### cell

| 属性名 | 数据类型 | 描述 |
| :------: | :------: | :------ |
| v | string, number, boolean, Date | 原始数据 |
| w | string |针对原始数据格式化之后的文本 |
| t | string |数据的基本类型，支持五种数据类型：`boolean`, `number`, `error`, `string`, `empty`, 对应的取值为 *b*, *n*, *e*, *s*, *e* |
| s | object |表格的样式 *CellStyle* |

### cell style

| 属性名 | 数据类型 | 描述 |
| :------: | :------: | :------ |
| ff | string | font family |
| fs | number | font size |
| fc | string | font color |
| bc | string | background color |
