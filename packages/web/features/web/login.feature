@web @system-a @epic:Authentication @owner:alanchan
Feature: Login
  As a shopper
  I want to sign in to the storefront
  So that I can browse and purchase products

  Background:
    Given I am on the login page

  @smoke @severity:critical
  Scenario: Successful login with valid credentials
    When I log in with valid credentials
    Then I should see the products page

  @severity:normal @owner:unknown
  Scenario: Login is rejected for a locked-out user
    When I log in as "locked_out_user"
    Then I should see an error message containing "locked out"

  # ⚠️ TEMPORARY — intentional failure to exercise the failure / Allure "Categories"
  # reporting path (a real failed assertion → "Product defects"). Remove this scenario
  # AND the matching step in login.steps.ts once the Categories trend is verified.
  # @demo-fail
  # Scenario: Intentional failure to populate the failure report
  #   When I log in with valid credentials
  #   Then the products title should be "This Title Does Not Exist"
