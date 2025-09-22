package com.klu.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.klu.model.Jobs;
import com.klu.model.JobsManager;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;




@RestController
@CrossOrigin
@RequestMapping("/jobs")
public class JobsController {
  
  @Autowired
  JobsManager JM;
  
  @PostMapping("/createjobs")
  public String postMethodName(@RequestBody Jobs J) {
    
    
    return JM.createJobs(J);
  }
  @GetMapping("/read")
  public String read() {
    return JM.readJobs();
  }
  
  

}