import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Adminsidebar from "./AdminSidebar";
import Managersidebar from "./Managersidebar";
import Mentorsidebar from "./Mentorsidebar";
import Evaluatorsidebar from "./Evaluatorsidebar";
import Header from "./Header";
import AspectRatio from "@mui/joy/AspectRatio";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Divider from "@mui/joy/Divider";
import { FormControl, FormLabel, Select, MenuItem } from "@mui/joy";
import Input from "@mui/joy/Input";
import IconButton from "@mui/joy/IconButton";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Card from "@mui/joy/Card";
import CardActions from "@mui/joy/CardActions";
import CardOverflow from "@mui/joy/CardOverflow";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import axios from "axios";
import { BASE_URL } from "../../config";
import image3 from "../../assets/Unknown_person.jpg"
import Swal from "sweetalert2";
import {
  deleteObject,
  getDownloadURL,
  ref, uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../../firebaseconfig";
import { uuidv4 } from '@firebase/util';
import { CircularProgress } from "@mui/material";
import { useUserData } from '../Contexts/UserContext.jsx';
import DOMPurify from "dompurify";

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

// Sanitize input using DOMPurify and remove header-breaking chars
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  let sanitized = DOMPurify.sanitize(input);
  sanitized = sanitized.replace(/(\r|\n|%0a|%0d|\\r|\\n)/gi, ''); // Prevent header injection
  return sanitized;
};

// Prevent path traversal in file uploads
const isSafeFileName = (name) => {
  // Only allow alphanumeric, dash, underscore, and dot
  return /^[a-zA-Z0-9._-]+$/.test(name);
};

export default function Profile() {
  const [role, setRole] = useState("");
  const [data, setData] = useState({
    fname: "",
    lname: "",
    dob: "",
    gender: "",
    email: "",
    jobtitle: '',
    department: '',
    employmentType: ''
  });
  const [originalData, setOriginalData] = useState({});
  const { fetchUserData } = useUserData();
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const token = localStorage.getItem('token');
  const [oldImagePath, setOldImagePath] = useState(null);
  const decodedToken = jwtDecode(token);
  const userRole = decodedToken.role;
 
  if (userRole === 'intern') {
    Swal.fire({
      text: 'You do not have permission to access this function.',
      icon: 'error',
      width: '400px',
      customClass: {
        container: 'my-swal',
        confirmButton: 'my-swal-button' 
      }
    });
   
    return null; // Do not render the component
  }

  useEffect(() => {
  
    if (token) {
      const decodedToken = jwtDecode(token);
      setRole(decodedToken.role);
    }
  }, []);

  const getSidebar = () => {
    switch (role) {
      case "admin":
        return <Adminsidebar />;
      case "mentor":
        return <Mentorsidebar />;
      case "evaluator":
        return <Evaluatorsidebar />;
      case "manager":
        return <Managersidebar />;
      default:
        return null;
    }
  };
  useEffect(() => {
    if (image) {
      uploadFile();
    }
  }, [image]);


  useEffect(() => {
  
    axios
      .get(`${BASE_URL}user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((result) => {
        setData(result.data.user);
        setOriginalData(result.data.user);
        setImageUrl(result.data.user.imageUrl);
        console.log(result.data.user.imageUrl);
      })
      .catch((err) => console.log(err));
  }, []);

 const handleCancel = () => {
    // Reset the form data to the original data
    setData(originalData);
  };

  // Centralized input change handler with sanitization and validation
  const handleInputChange = (field, value) => {
    let sanitizedValue = sanitizeInput(value);
    let isValid = true;
    switch (field) {
      case "fname":
      case "lname":
        isValid = validateName(sanitizedValue);
        break;
      case "email":
        isValid = validateEmail(sanitizedValue);
        break;
      case "dob":
        isValid = validateDate(sanitizedValue);
        break;
      // Add more validation as needed
      default:
        break;
    }
    if (isValid || sanitizedValue === "") {
      setData({ ...data, [field]: sanitizedValue });
    }
  };

  // Upload file with path traversal and type check
  const uploadFile = () => {
    if (image === null) {
      return;
    }
    // Only allow image types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      Swal.fire({
        text: "Invalid file type. Only images are allowed.",
        icon: "error",
        customClass: {
          container: 'my-swal',
          confirmButton: 'my-swal-button'
        }
      });
      return;
    }
    // Prevent path traversal by checking file name
    if (!isSafeFileName(image.name)) {
      Swal.fire({
        text: "Invalid file name.",
        icon: "error",
        customClass: {
          container: 'my-swal',
          confirmButton: 'my-swal-button'
        }
      });
      return;
    }
    const imagePath = `img/${image.name + uuidv4()}`;
    const imageRef = ref(storage,imagePath);
    const uploadFile = uploadBytesResumable(imageRef, image);
  
    uploadFile.on('state_changed', (snapshot) => {
      const progress = Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100);
      setProgress(progress)
    }, (err) => {
      console.log("error while uploading file", err);
    }, () => {
      setProgress(0);
      getDownloadURL(uploadFile.snapshot.ref).then((downloadURL) => {
        console.log('File available at', downloadURL);
        
        // Delete the previous image
        if (oldImagePath) {
          const oldImageRef = ref(storage, oldImagePath);
          deleteObject(oldImageRef).then(() => {
            console.log('Old image deleted');
          }).catch((error) => {
            console.log('Failed to delete old image', error);
          });
        }
        console.log(imagePath);
        // Save the path of the uploaded image
        setOldImagePath(imagePath);
        console.log(oldImagePath);
  
          setImageUrl(downloadURL)
         console.log(downloadURL);
          console.log(imageUrl);
         
          axios
             .put(`${BASE_URL}uploadImage`,{imageUrl:downloadURL}, {
               headers: { Authorization: `Bearer ${token}` },
             })
             .then((response) => {
                console.log(response.data.msg);
                fetchUserData();
             })
             .catch((error) => {
               console.log(error);
             });
  
        });
        setImage(null);
      });
     
    }

const handleSubmit = (e) => {
    e.preventDefault();
    // Validate all fields before submission
    if (
      !validateName(data.fname) ||
      !validateName(data.lname) ||
      !validateEmail(data.email) ||
      !validateDate(data.dob)
    ) {
      Swal.fire({
        position: "top",
        text: "Please provide valid input for all required fields.",
        icon: "error",
        customClass: {
          container: 'my-swal',
          confirmButton: 'my-swal-button'
        }
      });
      return;
    }
    const dob = new Date(data.dob);
    const today = new Date();
    if (dob >= today) {
      Swal.fire({
        position: "top",
        text: "Date of birth must be in the past.",
        customClass: {
          container: 'my-swal',
          confirmButton: 'my-swal-button'
        }
      });
      return;
    }
    // Only send allowed fields to backend (prevent mass assignment)
    const allowedFields = [
      "fname", "lname", "dob", "gender", "email", "jobtitle", "department", "employmentType"
    ];
    const safeData = {};
    allowedFields.forEach(field => {
      safeData[field] = sanitizeInput(data[field]);
    });
    //update photo after the click save button it not uersfrienly so commented it
    // uploadFile();
    axios
      .put(`${BASE_URL}updateuser`, safeData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        Swal.fire({
          position: "top",
          text: response.data.msg,
          customClass: {
            container: 'my-swal',
            confirmButton: 'my-swal-button'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            fetchUserData();
          }
        });
        // window.alert(response.data.msg);
        console.log(response.data);

      })
      .catch((error) => {
        console.log(error);
      });
 };
 
  return (
    <>
      <Header />
      <Box height={60} />
      <Box sx={{ display: "flex" }}>
        {getSidebar()}

        
        <Box sx={{ flex: 1, width: "100%",  justifyContent: "center"}} >
          <Stack
            spacing={4}
            sx={{
              display: "flex",
              maxWidth: "800px",
              mx: "auto",
              px: { xs: 2, md: 6 },
              py: { xs: 2, md: 3 },
              justifyContent: "center",

            }}
          >
            <Card>
              <Box sx={{ mb: 1 }}>
                <Typography level="title-md">Personal info</Typography>
                <Typography level="body-sm">
                  Customize how your profile information will apper to the
                  networks.
                </Typography>
              </Box>
              <Divider />
              <Stack
                direction="row"
                spacing={3}
                sx={{ display: { xs: "none", md: "flex" }, my: 1 }}
              >
                <Stack direction="column" spacing={1}>
                  <AspectRatio
                    ratio="1"
                    maxHeight={200}
                    sx={{ flex: 1, minWidth: 120, borderRadius: "100%" }}
                  >
                     <img
                        src={imageUrl || image3} 
                        loading="lazy"
                        alt=""
                    />
                  </AspectRatio>
                  <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="icon-button-file"
                      type="file"
                      onChange={(event) => {
                        setImage(event.target.files[0]);
                      }}
                    />
                 <label htmlFor="icon-button-file">
                  <IconButton
                    aria-label="upload new picture"
                    size="sm"
                    variant="outlined"
                    color="neutral"
                    sx={{
                      bgcolor: "background.body",
                      position: "absolute",
                      zIndex: 2,
                      borderRadius: "50%",
                      left: 100,
                      top: 170,
                      boxShadow: "sm",
                    }}
                     component="span"
                  >
                    <EditRoundedIcon />
                  </IconButton>
                </label>  
                </Stack>
                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                  <Stack spacing={1}>
                    <FormLabel>Name</FormLabel>
                    <FormControl
                      sx={{
                        display: { sm: "flex-column", md: "flex-row" },
                        gap: 2,
                      }}
                    >
                      <Input size="sm" value={data.fname} 
                       onChange={e => handleInputChange("fname", e.target.value)} 
                       />
                    </FormControl>
                    <FormControl
                      sx={{
                        display: { sm: "flex-column", md: "flex-row" },
                        gap: 2,
                      }}
                    >
                      <Input
                        size="sm"
                        value={data.lname}
                        onChange={e => handleInputChange("lname", e.target.value)} 
                        sx={{ flexGrow: 1 }}
                      />
                    </FormControl>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <FormControl>
                      <FormLabel>Role</FormLabel>
                      <Input size="sm"
                        value={data.role} 
                        readOnly
                       />
                    </FormControl>
                    <FormControl sx={{ flexGrow: 1 }}>
                      <FormLabel>Email</FormLabel>
                      <Input
                        size="sm"
                        type="email"
                        value={data.email}
                        onChange={e => handleInputChange("email", e.target.value)}
                        startDecorator={<EmailRoundedIcon />}
                        sx={{ flexGrow: 1 }}
                      />
                    </FormControl>
                  </Stack>
               
                  <div>
                    <Stack direction="row" spacing={2}>
                      <FormControl sx={{ flexGrow: 1 }}>
                     
                        <FormLabel>Gender</FormLabel>
                        <Input
                      size="sm"
                      value={data.gender}
                      onChange={e => handleInputChange("gender", e.target.value)}
                      type="text"
                      fullWidth
                  
                    />
                      </FormControl>
                      <FormControl sx={{ flexGrow: 1 }}>
                        <FormLabel>Date of Birth</FormLabel>
                        <Input
                          size="sm"
                          value={data.dob}
                          type="date"
                          onChange={e => handleInputChange("dob", e.target.value)}
                          fullWidth
                       
                        />
                      </FormControl>
                    </Stack>
                  </div>
                </Stack>
              </Stack>
              <Stack
                direction="column"
                spacing={2}
                sx={{ display: { xs: "flex", md: "none" }, my: 1 }}
              >
                <Stack direction="row" spacing={2}>
                  <Stack direction="column" spacing={1}>
                    <AspectRatio
                      ratio="1"
                      maxHeight={108}
                      sx={{ flex: 1, minWidth: 108, borderRadius: "100%" }}
                    >
                       <img
                        src={imageUrl || image3} 
                        loading="lazy"
                        alt=""
                    />
                    </AspectRatio>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="icon-button-file"
                      type="file"
                      onChange={(event) => {
                        setImage(event.target.files[0])  
                      }}
                    />
                 <label htmlFor="icon-button-file">
                    <IconButton
                      aria-label="upload new picture"
                      size="sm"
                      variant="outlined"
                      color="neutral"
                      sx={{
                        bgcolor: "background.body",
                        position: "absolute",
                        zIndex: 2,
                        borderRadius: "50%",
                        left: 85,
                        top: 180,
                        boxShadow: "sm",
                      }}
                      component="span"
                    >
                      <EditRoundedIcon />
                    </IconButton>

                    </label>
                  </Stack>
                  <Stack spacing={1} sx={{ flexGrow: 1 }}>
                    <FormLabel>Name</FormLabel>
                    <FormControl
                      sx={{
                        display: {
                          sm: "flex-column",
                          md: "flex-row",
                        },
                        gap: 2,
                      }}
                    >
                      <Input size="sm" value={data.fname}
                      onChange={e => handleInputChange("fname", e.target.value)}
                      />
                    </FormControl>
                    <FormControl
                      sx={{
                        display: {
                          sm: "flex-column",
                          md: "flex-row",
                        },
                        gap: 2,
                      }}
                    >
                      <Input size="sm" value={data.lname} 
                      onChange={e => handleInputChange("lname", e.target.value)}
                      />
                    </FormControl>
                  </Stack>
                </Stack>
                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Input size="sm" value={data.role} readOnly
                  />
                </FormControl>
                <FormControl sx={{ flexGrow: 1 }}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    size="sm"
                    type="email"
                    startDecorator={<EmailRoundedIcon />}
                    value={data.email}
                    onChange={e => handleInputChange("email", e.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                </FormControl>

                <div>
                <FormControl sx={{ display: { sm: "contents" } }}>
                    <FormLabel>Gender</FormLabel>
                    <Input
                      size="sm"
                      value={data.gender}
                      type="text"
                      onChange={e => handleInputChange("gender", e.target.value)}
                      fullWidth
                  
                    />
                 
                 
                  </FormControl>
                  <FormControl>
                    <FormLabel>Date of Birth</FormLabel>
                    <Input
                      size="sm"
                      value={data.dob}
                      type="date"
                      onChange={e => handleInputChange("dob", e.target.value)}
                      fullWidth
                  
                    />
                  </FormControl>
                </div>
              </Stack>
             
            </Card>
                  
                <Card>
                  <Box sx={{ mb: 1 }}>
                    <Typography level="title-md">job details</Typography>
                  </Box>
                  <Divider />
                  <div>
                    <Stack direction="row" spacing={2}>
                      <FormControl sx={{ flexGrow: 1 }}>
                     
                        <FormLabel>Job title</FormLabel>
                        <Input
                      size="sm"
                      value={data.jobtitle}
                      type="text"
                      onChange={e => handleInputChange("jobtitle", e.target.value)}
                      fullWidth
                  
                    />
                      </FormControl>
                      <FormControl sx={{ flexGrow: 1 }}>
                        <FormLabel>Department</FormLabel>
                        <Input
                          size="sm"
                          value={data.department}
                          onChange={e => handleInputChange("department", e.target.value)}
                          type="text"
                          fullWidth
                       
                        />
                      </FormControl>
                    </Stack>
                  </div>

              <FormControl sx={{ display: { sm: "contents" } }}>
                    <FormLabel>employmentType</FormLabel>
                    <Input
                      size="sm"
                      value={data.employmentType}
                      type="text"
                      onChange={e => handleInputChange("employmentType", e.target.value)}
                      fullWidth
                     />
              </FormControl>

          <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
              <Button size="sm" variant="outlined" color="neutral" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" variant="solid" type="submit" onClick={handleSubmit}>
                Save
              </Button>
            </CardActions>
          </CardOverflow>
         </Card>
          </Stack>
            
        </Box>
       
      </Box>
    </>
  );
}

// --- BACKEND SECURITY REMINDERS (not in this file, but required) ---
// 1. Use express-validator and express-mongo-sanitize on all profile update endpoints.
// 2. Whitelist allowed fields on backend to prevent mass assignment.
// 3. Validate and sanitize file uploads on backend (type, name, path traversal).
// 4. Never trust client-side validation alone.



