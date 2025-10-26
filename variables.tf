variable "rg_name" {
  type    = string
  default = "DevopsProject"
}

variable "location" {
  type    = string
  default = "southindia"
}

# ACR name must be globally unique, we use initials + random number
variable "acr_name" {
  type    = string
  default = "devopsmsb123"  
}

variable "aks_name" {
  type    = string
  default = "devops-aks"
}
