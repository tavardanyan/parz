import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Invoice from './Invoice';
import { useGlobalContext } from './GlobalContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const tabStyle = {}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, paddingRight: 0 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}

export default function Orders() {
  const [value, setValue] = React.useState(0);
  const { orders, activeOrderId, setActiveOrderId } = useGlobalContext();
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveOrderId(newValue);
  };
  console.log('Orders component rendered with orders:', orders);

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        height: 224,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        m: 4,
        padding: 1,
        paddingRight: 0,
        paddingLeft: 0,
        backgroundColor: 'background.paper',
      }}
    >
      {/* {orders.map((order, index) => ( */}
        <TabPanel value={activeOrderId} index={activeOrderId}>
          {activeOrderId}
          <Invoice items={orders.find(({ id }) => id === activeOrderId)}/>
        </TabPanel>
      {/* ))} */}
      {/* <TabPanel value={value} index={1}>
        <Invoice />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Invoice />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Invoice />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <Invoice />
      </TabPanel>
      <TabPanel value={value} index={5}>
        <Invoice />
      </TabPanel>
      <TabPanel value={value} index={6}>
        <Invoice />
      </TabPanel> */}
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={activeOrderId}
        onChange={(handleChange)}
        aria-label="Vertical tabs example"
        sx={{ 
          // backgroundColor: 'background.paper',
          // paddingRight: 2,
          '& .MuiTabs-indicator': {
            width: 4,
            borderRadius: 2,
            backgroundColor: 'primary.main',
            // left: 0,
            // right: 'auto',
          },
          '& .MuiTab-root': {
            right: 0,
            left: 0,
            border: 1,
            borderLeft: 0,
            borderColor: 'divider',
            padding: 3,
            paddingLeft: 0,
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 48,
            color: 'text.secondary',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            width: 100,
            '&.Mui-selected': {
              fontWeight: 800,
              borderLeft: 0,
              // backgroundColor: (theme) => theme.palette.background.default, // 20 for alpha
            },
          },
        }}
      >
        {orders.map((order) => (
          <Tab sx={tabStyle} label={order.id || "+"} {...a11yProps(order.id)} />
        ))}
        {/* <Tab sx={tabStyle} label="+" {...a11yProps(0)} />
        <Tab sx={tabStyle} label="345" {...a11yProps(1)} />
        <Tab sx={tabStyle} label="346" {...a11yProps(2)} />
        <Tab sx={tabStyle} label="347" {...a11yProps(3)} />
        <Tab sx={tabStyle} label="348" {...a11yProps(4)} />
        <Tab sx={tabStyle} label="349" {...a11yProps(5)} />
        <Tab sx={tabStyle} label="350" {...a11yProps(6)} /> */}
      </Tabs>
    </Box>
  );
}