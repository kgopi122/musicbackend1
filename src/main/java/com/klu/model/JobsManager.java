package com.klu.model;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.gson.GsonBuilder;
import com.klu.repository.*;

@Service
public class JobsManager {
  
  @Autowired
  JobsRespository JR;
  
  public String createJobs(Jobs J)
  {
    try {
      JR.save(J);
      return "200:: New Job has been created";
      
    } catch (Exception e) {
      return "404::" + e.getMessage();
    }
  }
  

public String readJobs()
{
  try {
    List<Jobs> jobsList = JR.findAll();
    return new GsonBuilder().create().toJson(jobsList);
    
  } 
  
  catch (Exception e) 
  
  {
    return "404::" + e.getMessage();
  }
  }
}