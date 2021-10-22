<template>
  <div>
    <button @click="handleSubmit">提交</button>
    <button @click="handleToggleRowSelection">切换第一条的选中状态</button>
    <button @click="handleToggleAllSelection">切换所有数据的选中状态</button>
    <button @click="handleClearSelection">清空所有选中的选中状态</button>
    <button @click="handleGetCleanVirtualData">获取干净的数据</button>
    <button @click="handleClearValidate">清空所有数据的错误验证</button>
    <button @click="handleClearSingleValidate">清空0-0的age的错误验证</button>
    <virtual-table
      ref="virtualTable"
      height="1000px"
      border
      show-summary
      :table-data="tableData"
      :validate-map="validateMap"
      :selection="true"
      :default-expand-all="true"
      @selection-change="handleSelectionChange"
      @select-all="handleSelectAll"
      @select="handleSelect"
      @forward-table-ref="ref=>tableRef = ref"
    >
      <virtual-table-column
        width="300"
        prop="name"
        label="姓名"
        fixed
      >
        <template v-slot="scope">
          <div class="el-input__inner el-input-text">
            {{scope.row.name}}
          </div>
        </template>
        <template v-slot:edit="scope">
          <el-input v-model="scope.row.name" />
        </template>
      </virtual-table-column>
      <el-table-column
        label="基本信息"
      >
        <virtual-table-column
          width="300"
          prop="age"
          label="年龄"
        >
          <template v-slot="scope">
            <div class="el-input__inner el-input-text center">
              {{ scope.row.age }}
            </div>
          </template>
          <template v-slot:edit="scope">
            <el-input-number v-model="scope.row.age" :controls="false"/>
          </template>
        </virtual-table-column>
        <virtual-table-column
          width="300"
          prop="nation"
          label="民族"
        >
          <template v-slot="scope">
            <div class="el-input__inner el-input-text">
              {{scope.row.nation | nationFilter}}
            </div>
          </template>
          <template v-slot:edit="scope">
             <el-select v-model="scope.row.nation">
              <el-option v-for="{value,label} in nations" :key="value" :value="value" :label="label"></el-option>
             </el-select>
          </template>
        </virtual-table-column>
        <virtual-table-column
          width="300"
          prop="address"
          label="住址"
        >
          <template v-slot="scope">
            <div class="el-input__inner el-input-text">
              {{scope.row.address}}
            </div>
          </template>
          <template v-slot:edit="scope">
             <el-input v-model="scope.row.address" type="textarea" />
          </template>
        </virtual-table-column>
      </el-table-column>
      
      <virtual-table-column
        width="300"
        prop="entryTime"
        label="入职时间"
      >
      </virtual-table-column>

      <el-table-column
        label="其他信息"
      >
        <virtual-table-column
          width="300"
          prop="hobby"
          label="爱好"
        >
          <template v-slot="scope">
            <div class="el-input__inner el-input-text">
              {{ scope.row.hobby | hobbyFilter }}
            </div>
          </template>
          <template v-slot:edit="scope">
            <el-select v-model="scope.row.hobby">
              <el-option v-for="{value,label} in hobbys" :key="value" :value="value" :label="label"></el-option>
            </el-select>
          </template>
        </virtual-table-column>
        
        <virtual-table-column
          width="300"
          prop="healthy"
          label="健康状态"
        >
          <template v-slot="scope">
            <div class="el-input__inner el-input-text">
              {{ scope.row.healthy | healthyFilter }}
            </div>
          </template>
          <template v-slot:edit="scope">
            <el-select v-model="scope.row.healthy">
              <el-option v-for="{value,label} in healthys" :key="value" :value="value" :label="label"></el-option>
            </el-select>
          </template>
        </virtual-table-column>
        <virtual-table-column
          width="300"
          prop="food"
          label="食物偏好"
        >
          <template v-slot="scope">
            <div class="el-input__inner el-input-text">
              {{ scope.row.food | foodFilter}}
            </div>
          </template>
          <template v-slot:edit="scope">
            <el-select v-model="scope.row.food">
              <el-option v-for="{value,label} in foods" :key="value" :value="value" :label="label"></el-option>
            </el-select>
          </template>
        </virtual-table-column>
        <virtual-table-column
          width="300"
          prop="smoke"
          label="是否抽烟"
        >
          <template v-slot="scope">
            <div class="el-input__inner el-input-text">
              {{ scope.row.smoke | smokeFilter}}
            </div>
          </template>
          <template v-slot:edit="scope">
            <el-select v-model="scope.row.smoke">
              <el-option v-for="{value,label} in smokes" :key="value" :value="value" :label="label"></el-option>
            </el-select>
          </template>
        </virtual-table-column>
      </el-table-column>
    </virtual-table>
  </div>
</template>

<script>
var Mock = require('mockjs')
const hobbys = [{
  value:'0',
  label:'篮球'
},{
  value:'1',
  label:'足球'
},{
  value:'2',
  label:'乒乓球'
},{
  value:'3',
  label:'羽毛球'
},{
  value:'4',
  label:'跑步'
},{
  value:'5',
  label:'游泳'
},{
  value:'6',
  label:'长跑'
},{
  value:'7',
  label:'美食'
}]
const nations = [{
  value:'0',
  label:'汉族'
},{
  value:'1',
  label:'回族'
},{
  value:'3',
  label:'苗族'
},{
  value:'4',
  label:'维吾尔族'
},{
  value:'5',
  label:'土家族'
},{
  value:'6',
  label:'客家族'
},{
  value:'7',
  label:'傣族'
}]
const healthys = [{
  value:'0',
  label:'健康'
},{
  value:'1',
  label:'亚健康'
}]
const foods = [{
  value:'0',
  label:'肉类'
},{
  value:'1',
  label:'蔬菜'
}]
const smokes = [{
  value:'0',
  label:'是'
},{
  value:'1',
  label:'否'
}]
export default {
  filters:{
    hobbyFilter(value){
      const hobby = hobbys.find(hobby=>hobby.value===value)
      return hobby.label
    },
    nationFilter(value){
      const nation = nations.find(nation=>nation.value===value)
      return nation.label
    },
    healthyFilter(value){
      const healthy = healthys.find(healthy=>healthy.value===value)
      return healthy.label
    },
    foodFilter(value){
      const food = foods.find(food=>food.value===value)
      return food.label
    },
    smokeFilter(value){
      const smoke = smokes.find(smoke=>smoke.value===value)
      return smoke.label
    }
  },
  data() {
    var data = Mock.mock({
        // 属性 list 的值是一个数组，其中含有 1 到 10 个元素
        'list|10': [{
            // 属性 id 是一个自增数，起始值为 1，每次增 1
            'id': '@guid',
            'name':'@cname',
            'age':'@integer(20,40)',
            'address':'@county(true)',
            'entryTime':'@date("yyyy-MM-dd")',
            'hobby|1':hobbys.map(({value})=>value),
            'nation|1':nations.map(({value})=>value),
            'healthy|1':healthys.map(({value})=>value),
            'food|1':foods.map(({value})=>value),
            'smoke|1':smokes.map(({value})=>value),
            'children|10-20':[
              {
                  // 属性 id 是一个自增数，起始值为 1，每次增 1
                  'id': '@guid',
                  'name':'@cname',
                  'age':'@integer(20,40)',
                  'address':'@county(true)',
                  'entryTime':'@date("yyyy-MM-dd")',
                  'hobby|1':hobbys.map(({value})=>value),
                  'nation|1':nations.map(({value})=>value),
                  'healthy|1':healthys.map(({value})=>value),
                  'food|1':foods.map(({value})=>value),
                  'smoke|1':smokes.map(({value})=>value),
                  'children|10-20':[
                    {
                        // 属性 id 是一个自增数，起始值为 1，每次增 1
                        'id': '@guid',
                        'name':'@cname',
                        'age':'@integer(20,40)',
                        'address':'@county(true)',
                        'entryTime':'@date("yyyy-MM-dd")',
                        'hobby|1':hobbys.map(({value})=>value),
                        'nation|1':nations.map(({value})=>value),
                        'healthy|1':healthys.map(({value})=>value),
                        'food|1':foods.map(({value})=>value),
                        'smoke|1':smokes.map(({value})=>value),
                    }
                  ]
              }
            ]
        }]
    })

    return {
      lineHeight: 44,
      tableData:data.list,
      hobbys,
      nations,
      healthys,
      foods,
      smokes,
      // 用来校验的规则,第一个参数数组指的是用于校验的字段,第二个参数是函数,传入单元格数据,this指的是当前组件
      // 返回是否是表单元素和校验规则,其中校验规则就是el-form上面的校验规则
      validateMap: new Map([
        [
          [
            'name' // 名称
          ],
          () => {
            const isFormItem = true
            let rules = []
            if (isFormItem) {
              rules = [{
                required: true,
                message: `请填写名称`
              }]
            }
            return {
              isFormItem,
              rules
            }
          }
        ],
        [
          [
            'age' // 年龄
          ],
          (row) => {
            const isFormItem = true
            let rules = []
            if (isFormItem) {
              rules = [{
                required: true,
                message: `请填写年龄`
              }, {
                validator(rule, value, callback) {
                  if (value === '') {
                    callback('请输入年龄')
                  } else {
                    if (row.age > 100) {
                      callback('年龄不能大于100岁')
                    }
                    callback()
                  }
                }
              }]
            }
            return {
              isFormItem,
              rules
            }
          }
        ]
      ]),
      multipleSelection: []
    }
  },
  mounted() {
    /* console.log(this.tableRef)
    console.log(this.$refs.virtualTable) */
  },
  methods: {
    handleClearSingleValidate() {
      const virtualTable = this.$refs.virtualTable
      const rows = this.tableData[0].children[0]
      virtualTable.clearValidate({ rows, props: 'age' })
    },
    handleClearValidate() {
      const virtualTable = this.$refs.virtualTable
      virtualTable.clearValidate()
    },
    handleGetCleanVirtualData() {
      console.log('被虚拟表格处理过的数据', this.tableData)
      const virtualTable = this.$refs.virtualTable
      const cleanData = virtualTable.getCleanVirtualData()
      console.log('干净的数据', cleanData)
    },
    handleSelect(selection, row, bool) {
      console.log('handleSelect', selection, row, bool)
      this.multipleSelection = selection
    },
    handleSelectAll(selection) {
      console.log('handleSelectAll', selection)
      this.multipleSelection = selection
    },
    handleSelectionChange(selection) {
      console.log('handleSelectionChange', selection)
      this.multipleSelection = selection
    },
    handleClearSelection() {
      const virtualTable = this.$refs.virtualTable
      virtualTable.clearSelection()
    },
    handleToggleAllSelection() {
      const virtualTable = this.$refs.virtualTable
      virtualTable.toggleAllSelection()
    },
    handleToggleRowSelection() {
      const virtualTable = this.$refs.virtualTable
      virtualTable.toggleRowSelection(this.tableData[0])
    },
    handleSubmit() {
      const virtualTable = this.$refs.virtualTable
      virtualTable.validate((valid, invalids) => {
        console.log(valid)
        console.log(invalids)
        if(valid){
          this.$message({
            message: '数据提交成功',
            type: 'success'
          });
        }else{
          const errorMessages = Object.values(invalids).flat()
          this.$message.error(errorMessages[0].message);
        }
      })
    }
  }
}
</script>
<style>
  .virtual-table{
    margin-top:50px;
  }
  .center{
    justify-content: center;
  }
</style>
