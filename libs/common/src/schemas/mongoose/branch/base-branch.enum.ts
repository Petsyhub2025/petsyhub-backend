export enum BranchStatusEnum {
  PENDING_ADMIN_APPROVAL = 'pendingAdminApproval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum BranchRejectionReferenceEnum {
  BRANCH_INFO = 'branchInfo',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum BranchTypeEnum {
  CLINIC = 'clinic',
  SHOP = 'shop',
  HOSTEL = 'hostel',
  DAYCARE = 'dayCare',
  SPA = 'spa',
}

export enum BranchEventsEnum {
  BRANCH_APPROVED = 'branch.post.save.approveBranch',
  BRANCH_SUSPEND = 'branch.post.save.suspendBranch',
  BRANCH_UNSUSPEND = 'branch.post.save.unsuspendBranch',
  BRANCH_CREATED = 'branch.post.save.createBranch',
}

export enum EstimationArrivalUnitEnum {
  HOURS = 'hours',
  MINS = 'mins',
}

export enum ShippingTypeEnum {
  FREE = 'free',
  PAID = 'paid',
}
