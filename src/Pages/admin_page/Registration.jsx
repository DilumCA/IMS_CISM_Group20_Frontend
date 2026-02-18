import React from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import Header from '../../components/common/Header';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
//import Adduser from '../adduser/Adduser';
import Addusertable from '../../components/adduser/Addusertable';
import DOMPurify from 'dompurify';

// Validation functions
const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateName = (name) =>
  /^[a-zA-Z\s'-]{2,50}$/.test(name);

const validateRole = (role) =>
  /^[a-zA-Z0-9_-]{2,30}$/.test(role);

const validateDate = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date);

const validateNumber = (num) =>
  /^\d+$/.test(num);

// Sanitize input using DOMPurify
const sanitizeInput = (input) => DOMPurify.sanitize(input);

// Remove dangerous MongoDB operators and header-breaking characters
const sanitizeForNoSQLAndHeader = (input) => {
  if (typeof input !== 'string') return input;
  // Remove $ and . to prevent NoSQL injection
  let sanitized = input.replace(/[$.]/g, '');
  // Remove CRLF and header-breaking characters
  sanitized = sanitized.replace(/(\r|\n|%0a|%0d|\\r|\\n)/gi, '');
  return sanitized;
};

export default function Registration() {

  const token = localStorage.getItem('token');
 
  return (
    <>
    <Grid > 
   <Grid item xs={12} sm={6} md={4}>
    <Header />
    <Box height={60} />
    <Box sx={{ display: 'flex' }}>
    <AdminSidebar />
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
         <Addusertable
          validateEmail={validateEmail}
          validateName={validateName}
          validateRole={validateRole}
          validateDate={validateDate}
          validateNumber={validateNumber}
          sanitizeInput={sanitizeInput}
          sanitizeForNoSQLAndHeader={sanitizeForNoSQLAndHeader}
         />
      
      </Box>
      </Box>
      </Grid>
      </Grid>
      </>
  )}
